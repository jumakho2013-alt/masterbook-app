/**
 * Last-write-wins merge helpers, shared by all business stores.
 *
 * Облачная синхронизация (см. cloudSync.ts) тянет с сервера «изменения» —
 * каждая строка несёт updated_at и, возможно, deleted_at (tombstone мягкого
 * удаления). Локально мы держим жёсткие записи + список tombstones. Слияние
 * детерминированно по времени правки: кто новее — тот и победил.
 *
 * Сравниваем по числовому времени (Date.getTime), НЕ лексикографически —
 * Postgres сериализует timestamptz иначе, чем JS toISOString(), и строковое
 * сравнение разных форматов давало бы неверный порядок.
 */

export interface Syncable {
  id: string;
  updatedAt?: string;
}

/** Локальный tombstone — запись удалена локально, ждёт пуша как deleted_at. */
export interface Tombstone {
  id: string;
  deletedAt: string;
}

export interface RemoteChange<T extends Syncable> {
  id: string;
  /** remote updated_at (ISO) */
  updatedAt: string;
  /** remote deleted_at (ISO) или null если запись живая */
  deletedAt: string | null;
  /** запись в локальной форме (camelCase); null если это tombstone */
  record: T | null;
}

const ts = (s?: string | null): number => {
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export interface MergeResult<T extends Syncable> {
  /** новый локальный массив записей (живых) */
  records: T[];
  /** id, которые сервер пометил удалёнными и которые мы локально удалили
   *  в результате слияния — их можно убрать из локальных tombstones, сервер
   *  уже знает об удалении. */
  appliedDeletes: string[];
}

/**
 * Слить серверные изменения в локальный массив по правилу last-write-wins.
 *  - remote deleted, deletedAt ≥ local.updatedAt → удаляем локально
 *  - remote live,    updatedAt  ≥ local.updatedAt (или локально нет) → апсертим
 *  - local новее    → оставляем локальное (будет ре-запушено наверх)
 */
export function mergeRemote<T extends Syncable>(
  local: T[],
  remote: RemoteChange<T>[],
): MergeResult<T> {
  const byId = new Map<string, T>(local.map((r) => [r.id, r]));
  const appliedDeletes: string[] = [];

  for (const ch of remote) {
    const cur = byId.get(ch.id);
    const localTs = ts(cur?.updatedAt);

    if (ch.deletedAt) {
      if (!cur) continue; // уже нет локально
      if (ts(ch.deletedAt) >= localTs) {
        byId.delete(ch.id);
        appliedDeletes.push(ch.id);
      }
      // иначе локальная правка новее удаления → оставляем (re-push как живую)
    } else if (ch.record) {
      if (ts(ch.updatedAt) >= localTs) {
        byId.set(ch.id, ch.record);
      }
      // иначе локальное новее → оставляем
    }
  }

  return { records: Array.from(byId.values()), appliedDeletes };
}
