/**
 * Облачная синхронизация (закрывает минус №1 — «потерял телефон = потерял всё»).
 *
 * Модель: local-first. Источник правды — локальные Zustand-сторы. Supabase —
 * зашифрованная резервная копия + канал между устройствами одного аккаунта.
 *
 * Стратегия — last-write-wins по updated_at (см. syncMerge.ts):
 *   • PULL: тянем все строки пользователя (включая tombstones deleted_at) и
 *     сливаем в сторы по времени правки.
 *   • PUSH: upsert живых записей (без колонки deleted_at — чтобы случайно не
 *     «воскресить» удалённое на другом устройстве) + проставляем deleted_at
 *     для локальных tombstones.
 *
 * Офлайн: любая сетевая ошибка ловится, статус → 'error'/'offline', tombstones
 * и updatedAt сохраняются. Повторная попытка — на следующей мутации или при
 * возврате приложения на передний план (AppState 'active'). NetInfo не нужен:
 * мы просто пробуем и при неудаче повторяем позже.
 *
 * НЕ синхронизируются device-local поля: reminderNotificationId,
 * calendarEventId (id локальных уведомлений/событий календаря), photoUri/photos
 * (локальные файлы — выгрузка в Storage отдельная фича). Их сохранность при
 * слиянии обеспечивает useAppointmentStore.mergeRemote.
 */
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { nowIso } from '@/src/utils/date';
import { setLocalMutationHandler } from './cloudSyncSignal';
import { captureException } from '@/src/lib/crashReporter';
import { flushPersist } from './persistStorage';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useSyncStore } from '@/src/stores/useSyncStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import type { RemoteChange } from './syncMerge';
import type { Client, Service, Appointment, FinanceEntry } from '@/src/types';

const PUSH_DEBOUNCE_MS = 2500;

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

// ── Row ⇄ entity mappers ───────────────────────────────────────────────────
// upsert-payload НЕ содержит deleted_at: upsert живой строки не должен сбрасывать
// серверный tombstone (удаление с другого устройства побеждает). created_at
// шлём только там, где он есть локально (clients) — иначе пусть БД проставит.

function clientToRow(c: Client, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    phone: c.phone ?? '',
    notes: c.notes ?? '',
    tags: c.tags ?? [],
    address: c.address ?? null,
    preferences: c.preferences ?? null,
    birthday: c.birthday ?? null,
    debt: c.debt ?? 0,
    photo_uri: c.photoUri ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt ?? c.createdAt ?? nowIso(),
  };
}
function rowToClientChange(r: any): RemoteChange<Client> {
  const deleted = r.deleted_at ?? null;
  return {
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: deleted,
    record: deleted
      ? null
      : {
          id: r.id,
          name: r.name,
          phone: r.phone ?? '',
          notes: r.notes ?? '',
          tags: r.tags ?? [],
          address: str(r.address),
          preferences: str(r.preferences),
          birthday: str(r.birthday),
          debt: num(r.debt),
          photoUri: str(r.photo_uri),
          createdAt: r.created_at ?? r.updated_at,
          updatedAt: r.updated_at,
        },
  };
}

function serviceToRow(s: Service, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    price: s.price,
    duration: s.duration,
    color: s.color,
    updated_at: s.updatedAt ?? nowIso(),
  };
}
function rowToServiceChange(r: any): RemoteChange<Service> {
  const deleted = r.deleted_at ?? null;
  return {
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: deleted,
    record: deleted
      ? null
      : {
          id: r.id,
          name: r.name,
          price: num(r.price),
          duration: num(r.duration),
          color: r.color,
          updatedAt: r.updated_at,
        },
  };
}

function appointmentToRow(a: Appointment, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    client_id: a.clientId ?? null,
    service_id: a.serviceId ?? null,
    date: a.date,
    start_time: a.startTime,
    end_time: a.endTime,
    status: a.status,
    price: a.price,
    deposit: a.deposit ?? null,
    deposit_paid: a.depositPaid ?? false,
    notes: a.notes ?? null,
    address: a.address ?? null,
    photos: a.photos ?? null,
    updated_at: a.updatedAt ?? nowIso(),
  };
}
function rowToAppointmentChange(r: any): RemoteChange<Appointment> {
  const deleted = r.deleted_at ?? null;
  return {
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: deleted,
    record: deleted
      ? null
      : {
          id: r.id,
          clientId: r.client_id ?? '',
          serviceId: r.service_id ?? '',
          date: r.date,
          startTime: r.start_time,
          endTime: r.end_time,
          status: r.status,
          price: num(r.price),
          deposit: r.deposit === null || r.deposit === undefined ? undefined : num(r.deposit),
          depositPaid: r.deposit_paid ?? false,
          notes: str(r.notes),
          address: str(r.address),
          photos: r.photos ?? undefined,
          updatedAt: r.updated_at,
        },
  };
}

function financeToRow(f: FinanceEntry, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    type: f.type,
    amount: f.amount,
    description: f.description,
    date: f.date,
    appointment_id: f.appointmentId ?? null,
    updated_at: f.updatedAt ?? nowIso(),
  };
}
function rowToFinanceChange(r: any): RemoteChange<FinanceEntry> {
  const deleted = r.deleted_at ?? null;
  return {
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: deleted,
    record: deleted
      ? null
      : {
          id: r.id,
          type: r.type,
          amount: num(r.amount),
          description: r.description ?? '',
          date: r.date,
          appointmentId: str(r.appointment_id),
          updatedAt: r.updated_at,
        },
  };
}

// ── current user ────────────────────────────────────────────────────────────
function currentUserId(): string | null {
  const { user, localOnlyMode } = useAuthStore.getState();
  if (localOnlyMode) return null; // local-only: облако не используется вовсе
  return user?.id ?? null;
}

/** По ~25 байт на id в URL: 100 штук ≈ 2.5 КБ — безопасно для любого шлюза. */
const TOMBSTONE_CHUNK = 100;

/** Чанк для upsert: 1.2 МБ одним запросом на 3G — одна точка отказа без
 *  частичного прогресса. 500 строк ≈ 200 КБ. */
const UPSERT_CHUNK = 500;

// ── PUSH ─────────────────────────────────────────────────────────────────────
/** Числовое время. Лексикографически ISO-строки сравнивать нельзя: Postgres
 *  сериализует timestamptz иначе, чем JS toISOString(). */
const ms = (iso?: string | null): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Отобрать строки, изменённые после последней успешной отправки этой таблицы.
 *
 * Метки локальные, и `updatedAt` тоже ставит устройство — сравниваются два
 * значения ОДНИХ часов, так что расхождение времени между устройствами тут ни
 * при чём. Опасен только перевод часов назад на самом устройстве: правка
 * получит `updatedAt` раньше метки и в инкрементальный пуш не попадёт. Ровно
 * поэтому `syncNow` раз в несколько минут делает полный пуш — он такую строку
 * подберёт (см. вызовы pushAll ниже).
 */
function changedSince<T extends { updatedAt?: string }>(rows: T[], markIso?: string): T[] {
  if (!markIso) return rows; // метки нет (первый запуск, другой аккаунт) → шлём всё
  const mark = ms(markIso);
  return rows.filter((r) => ms(r.updatedAt) > mark);
}

/** Максимальный updatedAt среди отправленных строк — новая метка таблицы. */
function newestUpdatedAt(rows: { updatedAt?: string }[]): string | null {
  let best = 0;
  let iso: string | null = null;
  for (const r of rows) {
    const t = ms(r.updatedAt);
    if (t > best) {
      best = t;
      iso = r.updatedAt ?? null;
    }
  }
  return iso;
}

async function pushTable(
  table: string,
  rows: Record<string, unknown>[],
  tombstoneIds: string[],
  userId: string,
): Promise<void> {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  if (tombstoneIds.length > 0) {
    const ts = nowIso();
    // .in() кодируется в query-строку. При ~330 удалениях URL перерастает
    // лимит заголовков шлюза → HTTP 414 → pushAll падает → tombstones НЕ
    // очищаются → следующий push шлёт тот же длинный URL. Это был вечный
    // дедлок: удаления никогда не доезжали до сервера. Шлём чанками.
    for (let i = 0; i < tombstoneIds.length; i += TOMBSTONE_CHUNK) {
      const chunk = tombstoneIds.slice(i, i + TOMBSTONE_CHUNK);
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: ts, updated_at: ts })
        .eq('user_id', userId)
        .in('id', chunk);
      if (error) throw new Error(`${table} delete: ${error.message}`);
    }
  }
}

/**
 * Отправка локальных изменений в облако.
 *
 * 'incremental' — только строки, изменённые с прошлой успешной отправки. Это
 *   путь частого отложенного пуша после каждой правки.
 * 'full' — весь локальный набор. Путь syncNow (не чаще раза в 5 минут) и
 *   flushPush перед выходом. Служит страховкой: если инкрементальный пуш
 *   пропустил строку (например, на устройстве перевели часы назад), полный
 *   пуш подберёт её в течение нескольких минут.
 */
export async function pushAll(userId: string, mode: 'incremental' | 'full' = 'full'): Promise<void> {
  // 1. Профиль обязан существовать — на него FK у всех бизнес-таблиц. Триггер
  //    создаёт его при регистрации, но upsert тут страхует (идемпотентно).
  const settings = useSettingsStore.getState();
  const auth = useAuthStore.getState();
  const { error: profileErr } = await supabase.from('profiles').upsert(
    {
      id: userId,
      name: settings.masterName ?? '',
      profession_category: auth.professionCategory,
      specialization_id: auth.specializationId,
      currency: settings.currency, // валюта мастера → корректные цены на сайте
    },
    { onConflict: 'id' },
  );
  if (profileErr) throw new Error(`profiles upsert: ${profileErr.message}`);

  const clients = useClientStore.getState();
  const services = useServiceStore.getState();
  const appts = useAppointmentStore.getState();
  const fin = useFinanceStore.getState();

  const clientTombs = clients.tombstones.map((t) => t.id);
  const serviceTombs = services.tombstones.map((t) => t.id);
  const apptTombs = appts.tombstones.map((t) => t.id);
  const finTombs = fin.tombstones.map((t) => t.id);

  // Порядок: clients/services раньше appointments (на которые ссылаются), хотя
  // FK на эти ссылки нет — порядок лишь для логической чистоты.
  //
  // При mode='incremental' отправляем только изменённое с прошлого раза. Раньше
  // при КАЖДОЙ правке уезжал весь локальный набор: у мастера с 4000 записей это
  // полтора мегабайта на каждое «отметить визит выполненным».
  const sync = useSyncStore.getState();
  const метка = (table: string) =>
    mode === 'full' ? undefined : sync.pushMarks[`${userId}:${table}`];

  const отправить = async <T extends { updatedAt?: string }>(
    table: string,
    все: T[],
    вРяд: (item: T) => Record<string, unknown>,
    tombs: string[],
  ) => {
    const кандидаты = changedSince(все, метка(table));
    // Нечего слать и нечего удалять — запрос не нужен вовсе.
    if (кандидаты.length === 0 && tombs.length === 0) return;
    await pushTable(table, кандидаты.map(вРяд), tombs, userId);
    // Метку двигаем ТОЛЬКО после успеха этой таблицы: если следующая упадёт,
    // уже отправленное не будет слаться заново, а неотправленное не потеряется.
    const новая = newestUpdatedAt(кандидаты);
    if (новая) useSyncStore.getState().advancePushMark(`${userId}:${table}`, новая);
  };

  await отправить('clients', clients.clients, (c) => clientToRow(c, userId), clientTombs);
  await отправить('services', services.services, (s) => serviceToRow(s, userId), serviceTombs);
  await отправить('appointments', appts.appointments, (a) => appointmentToRow(a, userId), apptTombs);
  await отправить('finance_entries', fin.entries, (f) => financeToRow(f, userId), finTombs);

  // Tombstones успешно отправлены → чистим (после успеха каждого pushTable).
  if (clientTombs.length) clients.clearTombstones(clientTombs);
  if (serviceTombs.length) services.clearTombstones(serviceTombs);
  if (apptTombs.length) appts.clearTombstones(apptTombs);
  if (finTombs.length) fin.clearTombstones(finTombs);
}

// ── PULL ───────────────────────────────────────────────────────────────────

/** Размер страницы при выгрузке. PostgREST по умолчанию режет ответ на 1000
 *  строк БЕЗ ошибки, поэтому тянем постранично, пока страница полная. */
const PULL_PAGE_SIZE = 1000;

/**
 * Постраничная выгрузка всех строк таблицы пользователя.
 *
 * Раньше здесь был простой `select('*')`: у мастера с 3000 записей на новое
 * устройство приезжала ПРОИЗВОЛЬНАЯ первая тысяча (сортировки не было), а
 * статус показывал «Синхронизировано» — то есть тихая потеря двух третей
 * данных ровно в том сценарии, ради которого синк и делался («потерял телефон»).
 * Сортировка по id обязательна: без неё страницы могут пересекаться и терять
 * строки.
 */
async function pullTable(table: string, userId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PULL_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PULL_PAGE_SIZE - 1);
    if (error) throw new Error(`pull ${table}: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PULL_PAGE_SIZE) break;
  }
  return rows;
}

async function pullAll(userId: string): Promise<void> {
  const [clients, services, appts, finance] = await Promise.all([
    pullTable('clients', userId),
    pullTable('services', userId),
    pullTable('appointments', userId),
    pullTable('finance_entries', userId),
  ]);

  useClientStore.getState().mergeRemote(clients.map(rowToClientChange));
  useServiceStore.getState().mergeRemote(services.map(rowToServiceChange));
  useAppointmentStore.getState().mergeRemote(appts.map(rowToAppointmentChange));
  useFinanceStore.getState().mergeRemote(finance.map(rowToFinanceChange));
}

// ── Orchestration ────────────────────────────────────────────────────────────
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;
let syncInFlight = false;
let lastAppState: AppStateStatus = AppState.currentState;
let lastForegroundSyncAt = 0;
/** Не тянуть весь набор чаще раза в 5 минут при возврате из фона. */
const FOREGROUND_SYNC_MIN_INTERVAL_MS = 5 * 60_000;
/** Разброс старта, чтобы утренний пик не пришёлся на одну секунду. */
const FOREGROUND_SYNC_JITTER_MS = 30_000;
let pushQueuedAgain = false;
let appStateSub: NativeEventSubscription | null = null;
let started = false;

function classifyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg;
}

async function pushNow(): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;
  if (pushInFlight) {
    pushQueuedAgain = true;
    return;
  }
  pushInFlight = true;
  useSyncStore.getState().setStatus('syncing');
  try {
    await pushAll(userId, 'incremental');
    useSyncStore.getState().setSynced(nowIso());
  } catch (e) {
    useSyncStore.getState().setError(classifyError(e));
    captureException(e, { tag: 'cloud-sync-push' });
  } finally {
    pushInFlight = false;
    if (pushQueuedAgain) {
      pushQueuedAgain = false;
      scheduledPush();
    }
  }
}

/** Debounced-пуш: дёргается из сторов после каждой мутации. */
function scheduledPush(): void {
  if (!currentUserId()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Полная синхронизация: pull → push. Вызывается при входе/восстановлении
 * сессии и при возврате приложения на передний план. Pull сначала — забираем
 * чужие изменения, затем push — отправляем локальные (LWW разрулит конфликты).
 */
export async function syncNow(): Promise<{ ok: boolean; error?: string }> {
  const userId = currentUserId();
  if (!userId) return { ok: false, error: 'no-user' };
  // Без этого два вызова (pull-to-refresh + возврат из фона) шли параллельно:
  // второй pull читал снимок до того, как первый push долил строки, и мог
  // «воскресить» только что удалённую запись.
  if (syncInFlight) return { ok: false, error: 'sync-in-flight' };
  syncInFlight = true;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  useSyncStore.getState().setStatus('syncing');
  try {
    await pullAll(userId);
    await pushAll(userId, 'full');
    useSyncStore.getState().setSynced(nowIso());
    return { ok: true };
  } catch (e) {
    const msg = classifyError(e);
    useSyncStore.getState().setError(msg);
    captureException(e, { tag: 'cloud-sync-now' });
    return { ok: false, error: msg };
  } finally {
    syncInFlight = false;
  }
}

/**
 * Принудительно дослать локальные изменения в облако СЕЙЧАС (без debounce).
 * Вызывается перед signOut: локальные сторы вот-вот будут стёрты, поэтому
 * незапушенные правки/удаления надо сохранить, иначе они пропадут. Возвращает
 * ok=false при сетевой ошибке — UI тогда предупреждает перед выходом.
 */
export async function flushPush(): Promise<{ ok: boolean; error?: string }> {
  const userId = currentUserId();
  if (!userId) return { ok: true }; // нечего слать (local-only / не залогинен)
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  try {
    await pushAll(userId, 'full');
    useSyncStore.getState().setSynced(nowIso());
    return { ok: true };
  } catch (e) {
    const msg = classifyError(e);
    useSyncStore.getState().setError(msg);
    captureException(e, { tag: 'cloud-sync-flush' });
    return { ok: false, error: msg };
  }
}

/**
 * Запись публичного профиля (город/район/о себе/slug/published) в Supabase
 * ОТДЕЛЬНЫМ targeted-запросом — НЕ через pushAll. Иначе второе устройство со
 * старым локальным `published` при обычном синке молча перезаписало бы
 * серверное значение (cross-device unpublish). Зовётся из экрана «Опубликовать»
 * при сохранении. Требует аккаунт (в local-only возвращает no-user).
 */
export async function pushPublicProfile(): Promise<{ ok: boolean; error?: string }> {
  const userId = currentUserId();
  if (!userId) return { ok: false, error: 'no-user' };
  const s = useSettingsStore.getState();
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        // Имя редактируется на экране публикации, но раньше уходило только
        // обычным синком — на сайте оставалось старое до следующего syncNow.
        name: s.masterName ?? '',
        city: s.city || null,
        district: s.district || null,
        bio: s.bio || null,
        slug: s.slug || null,
        whatsapp: s.whatsapp || null,
        public_phone: s.publicPhone || null,
        // Реальное расписание мастера → на сайт. Без этого профиль на сайте
        // всегда показывал дефолт 09:00–20:00 Пн–Сб, и онлайн-запись принимала
        // заявки вне его часов (см. supabase/functions/book проверяет эти поля).
        work_days: s.workDays,
        work_hours_start: s.workHours.start,
        work_hours_end: s.workHours.end,
        // Перерыв не синкался вообще → edge-функция book знала только рабочие
        // часы и разрешала запись в обед мастера.
        break_enabled: s.breakTime.enabled,
        break_start: s.breakTime.start,
        break_end: s.breakTime.end,
        buffer_minutes: s.bufferMinutes,
        currency: s.currency,
        portfolio_photos: s.portfolioPhotos,
        published: s.published,
      })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e) {
    const msg = classifyError(e);
    captureException(e, { tag: 'cloud-sync-publish' });
    return { ok: false, error: msg };
  }
}

/** Запустить авто-синк: debounced push на мутациях + полный sync на foreground.
 *  Идемпотентно. Вызывать после успешного входа (не в local-only). */
export function startAutoSync(): void {
  if (started) return;
  started = true;
  setLocalMutationHandler(scheduledPush);
  appStateSub = AppState.addEventListener('change', (s: AppStateStatus) => {
    const prev = lastAppState;
    lastAppState = s;
    // Уходим в фон — немедленно сбрасываем отложенные записи persist на диск,
    // иначе последние правки (до 400 мс) не переживут выгрузку приложения.
    if (s === 'background' || s === 'inactive') void flushPersist();
    // Раньше синк запускался на ЛЮБОЙ 'active'. Но iOS шлёт его при закрытии
    // Face ID-промпта, системного алерта, шторки Control Center, входящем
    // звонке — то есть полный синк дёргался по десятку раз за сеанс.
    // Реагируем только на реальный возврат из фона.
    if (!(prev === 'background' || prev === 'inactive') || s !== 'active') return;
    // Троттл: чаще раза в 5 минут забирать весь набор смысла нет.
    const now = Date.now();
    if (now - lastForegroundSyncAt < FOREGROUND_SYNC_MIN_INTERVAL_MS) return;
    lastForegroundSyncAt = now;
    // Джиттер: без него 100k устройств утром синкаются в одну секунду и
    // складывают бэкенд. Размазываем всплеск по полминуты.
    setTimeout(() => void syncNow(), Math.random() * FOREGROUND_SYNC_JITTER_MS);
  });
}

/** Остановить авто-синк (вызывать при signOut). Сбрасывает все таймеры/флаги. */
export function stopAutoSync(): void {
  setLocalMutationHandler(null);
  appStateSub?.remove();
  appStateSub = null;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pushInFlight = false;
  pushQueuedAgain = false;
  started = false;
  useSyncStore.getState().reset();
}

/** Тест-хелпер: сбросить внутренние флаги модуля между тестами. */
export function __resetCloudSyncInternals(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  pushInFlight = false;
  pushQueuedAgain = false;
  appStateSub = null;
  started = false;
}
