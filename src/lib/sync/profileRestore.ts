import { supabase } from '@/src/lib/supabase';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { CURRENCY_CODES, type CurrencyCode } from '@/src/utils/currency.types';
import type { ProfessionCategory } from '@/src/types/profession';
import { captureException } from '@/src/lib/crashReporter';

// Профиль мастера живёт на телефоне (useSettingsStore) и пушится в profiles,
// но обратно не читался никогда. На новом телефоне или после переустановки:
//   • первый синк слал name: '' — в каталоге мастер оставался без имени;
//   • онбординг заново добавлял шаблонные услуги поверх скачанных — дубли на сайте;
//   • «Опубликовать» генерировал НОВЫЙ slug — ссылка, разосланная клиентам, умирала;
//   • график сбрасывался на 09–20, и сайт принимал записи по нему.
// Поэтому сразу после входа, ДО решения «показывать ли онбординг», забираем
// профиль с сервера.

const PROFESSIONS: readonly ProfessionCategory[] = [
  'beauty', 'health', 'repair', 'education', 'photo', 'auto', 'home', 'pets', 'events', 'handmade', 'other',
];
const HHMM = /^\d{2}:\d{2}$/;

export type RestoredProfession = {
  professionCategory: ProfessionCategory;
  specializationId: string | null;
} | null;

type ServerProfile = {
  name: string | null;
  profession_category: string | null;
  specialization_id: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  slug: string | null;
  whatsapp: string | null;
  public_phone: string | null;
  published: boolean | null;
  portfolio_photos: string[] | null;
  currency: string | null;
  work_days: number[] | null;
  work_hours_start: string | null;
  work_hours_end: string | null;
  break_enabled: boolean | null;
  break_start: string | null;
  break_end: string | null;
  buffer_minutes: number | null;
};

/** Чистая часть — что взять с сервера в локальные настройки. Вынесена для тестов. */
export function settingsFromServer(p: ServerProfile): Partial<ReturnType<typeof useSettingsStore.getState>> {
  const out: Partial<ReturnType<typeof useSettingsStore.getState>> = {};
  if (p.name?.trim()) out.masterName = p.name.trim();
  if (p.city) out.city = p.city;
  if (p.district) out.district = p.district;
  if (p.bio) out.bio = p.bio;
  if (p.slug) out.slug = p.slug;
  if (p.whatsapp) out.whatsapp = p.whatsapp;
  if (p.public_phone) out.publicPhone = p.public_phone;
  if (typeof p.published === 'boolean') out.published = p.published;
  if (Array.isArray(p.portfolio_photos)) out.portfolioPhotos = p.portfolio_photos;
  if (p.currency && (CURRENCY_CODES as readonly string[]).includes(p.currency)) {
    out.currency = p.currency as CurrencyCode;
  }
  if (Array.isArray(p.work_days) && p.work_days.length > 0) out.workDays = p.work_days;
  if (p.work_hours_start && p.work_hours_end && HHMM.test(p.work_hours_start) && HHMM.test(p.work_hours_end)) {
    out.workHours = { start: p.work_hours_start, end: p.work_hours_end };
  }
  if (typeof p.break_enabled === 'boolean' && p.break_start && p.break_end
      && HHMM.test(p.break_start) && HHMM.test(p.break_end)) {
    out.breakTime = { enabled: p.break_enabled, start: p.break_start, end: p.break_end };
  }
  if (typeof p.buffer_minutes === 'number' && p.buffer_minutes >= 0) out.bufferMinutes = p.buffer_minutes;
  return out;
}

/**
 * Забрать профиль с сервера сразу после входа.
 *
 * Локальное НЕ перетираем, если телефон уже знает этого мастера (есть имя
 * или slug) — тогда источник правды по-прежнему телефон. Возвращает
 * профессию, если мастер уже проходил онбординг (тогда его можно пропустить),
 * иначе null. Сеть упала — молча null: поведение как раньше (онбординг).
 */
export async function restoreProfileFromServer(userId: string): Promise<RestoredProfession> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, profession_category, specialization_id, city, district, bio, slug, whatsapp, public_phone, published, portfolio_photos, currency, work_days, work_hours_start, work_hours_end, break_enabled, break_start, break_end, buffer_minutes')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const p = data as unknown as ServerProfile;

    const local = useSettingsStore.getState();
    const phoneKnowsMaster = Boolean(local.masterName?.trim() || local.slug);
    if (!phoneKnowsMaster) useSettingsStore.setState(settingsFromServer(p));

    const cat = p.profession_category as ProfessionCategory | null;
    if (cat && PROFESSIONS.includes(cat) && p.name?.trim()) {
      // Онбординг пропускаем — отметку первого запуска ставит именно он.
      if (!useSettingsStore.getState().firstUseAt) {
        useSettingsStore.setState({ firstUseAt: new Date().toISOString() });
      }
      return { professionCategory: cat, specializationId: p.specialization_id };
    }
    return null;
  } catch (e) {
    captureException(e, { tag: 'profile-restore' });
    return null;
  }
}
