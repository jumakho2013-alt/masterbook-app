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
import { setLocalMutationHandler } from '@/src/lib/cloudSyncSignal';
import { captureException } from '@/src/lib/crashReporter';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useSyncStore } from '@/src/stores/useSyncStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import type { RemoteChange } from '@/src/lib/syncMerge';
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

// ── PUSH ─────────────────────────────────────────────────────────────────────
async function pushTable(
  table: string,
  rows: Record<string, unknown>[],
  tombstoneIds: string[],
  userId: string,
): Promise<void> {
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  if (tombstoneIds.length > 0) {
    const ts = nowIso();
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: ts, updated_at: ts })
      .eq('user_id', userId)
      .in('id', tombstoneIds);
    if (error) throw new Error(`${table} delete: ${error.message}`);
  }
}

async function pushAll(userId: string): Promise<void> {
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
  await pushTable('clients', clients.clients.map((c) => clientToRow(c, userId)), clientTombs, userId);
  await pushTable('services', services.services.map((s) => serviceToRow(s, userId)), serviceTombs, userId);
  await pushTable('appointments', appts.appointments.map((a) => appointmentToRow(a, userId)), apptTombs, userId);
  await pushTable('finance_entries', fin.entries.map((f) => financeToRow(f, userId)), finTombs, userId);

  // Tombstones успешно отправлены → чистим (после успеха каждого pushTable).
  if (clientTombs.length) clients.clearTombstones(clientTombs);
  if (serviceTombs.length) services.clearTombstones(serviceTombs);
  if (apptTombs.length) appts.clearTombstones(apptTombs);
  if (finTombs.length) fin.clearTombstones(finTombs);
}

// ── PULL ───────────────────────────────────────────────────────────────────
async function pullAll(userId: string): Promise<void> {
  const [clientsRes, servicesRes, apptsRes, finRes] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', userId),
    supabase.from('services').select('*').eq('user_id', userId),
    supabase.from('appointments').select('*').eq('user_id', userId),
    supabase.from('finance_entries').select('*').eq('user_id', userId),
  ]);
  const firstError =
    clientsRes.error || servicesRes.error || apptsRes.error || finRes.error;
  if (firstError) throw new Error(`pull: ${firstError.message}`);

  useClientStore.getState().mergeRemote((clientsRes.data ?? []).map(rowToClientChange));
  useServiceStore.getState().mergeRemote((servicesRes.data ?? []).map(rowToServiceChange));
  useAppointmentStore.getState().mergeRemote((apptsRes.data ?? []).map(rowToAppointmentChange));
  useFinanceStore.getState().mergeRemote((finRes.data ?? []).map(rowToFinanceChange));
}

// ── Orchestration ────────────────────────────────────────────────────────────
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;
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
    await pushAll(userId);
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
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  useSyncStore.getState().setStatus('syncing');
  try {
    await pullAll(userId);
    await pushAll(userId);
    useSyncStore.getState().setSynced(nowIso());
    return { ok: true };
  } catch (e) {
    const msg = classifyError(e);
    useSyncStore.getState().setError(msg);
    captureException(e, { tag: 'cloud-sync-now' });
    return { ok: false, error: msg };
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
    await pushAll(userId);
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
    if (s === 'active') void syncNow();
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
