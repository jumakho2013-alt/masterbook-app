import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FieldConfig } from '@/src/types';
import type { CurrencyCode } from '@/src/utils/currency.types';

type ThemeSetting = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeSetting;
  workHours: { start: string; end: string };
  workDays: number[]; // 0=Sun, 1=Mon ... 6=Sat
  breakTime: { enabled: boolean; start: string; end: string };
  bufferMinutes: number; // 0, 15, 30
  fieldConfig: FieldConfig;
  masterName: string;
  /** Локальный URI фото мастера в профиле (постоянная папка приложения,
   *  persistImageToAppDir). null = показываем фирменный логотип MasterBook.
   *  Хранится только локально — как и masterName, профиль не тянется обратно
   *  через pullAll, поэтому облако не задействуем (иначе orphan-файлы + лишняя
   *  миграция без cross-device выгоды). */
  masterPhotoUri: string | null;
  /** Блокировка приложения биометрией (Face ID / Touch ID). */
  biometricLock: boolean;
  /** Публичный профиль для сайта-каталога (Фаза 2). Пишется в Supabase
   *  отдельным targeted-запросом при «Опубликовать» (pushPublicProfile),
   *  НЕ через обычный синк — иначе второе устройство со старым локальным
   *  published молча сняло бы публикацию. */
  city: string;
  district: string;
  bio: string;
  published: boolean;
  slug: string | null;
  whatsapp: string;
  publicPhone: string;
  /** Публичные URL фото-работ (бакет 'portfolio', public). Показываются в
   *  галерее на странице мастера; пушатся в profiles.portfolio_photos. */
  portfolioPhotos: string[];
  /** Валюта для отображения цен / дохода. Default RUB (СНГ-first).
   *  При смене все компоненты что зовут formatCurrency() перерисуются
   *  благодаря подписке через useSettingsStore. */
  currency: CurrencyCode;
  /** ISO timestamp когда пользователь засеял демо-данные (или null если
   *  никогда не засевал / уже очистил). Используется чтобы показать в UI
   *  кнопку «Очистить демо» только когда демо реально есть. */
  demoDataSeededAt: string | null;
  /** ISO timestamp первого использования приложения. Установится при
   *  первом завершении онбординга. Используется для авто-скрытия
   *  «Старт недели» через 7 дней. */
  firstUseAt: string | null;
  /** Если пользователь явно закрыл «Старт недели» — больше не показывать. */
  checklistDismissedAt: string | null;
  /** Юзер уже видел подсказку про свайп записей (показываем один раз).
   *  Device-preference — переживает logout, как тема. */
  swipeHintSeen: boolean;
  /** Синхронизация записей в системный календарь (iOS Calendar / Google).
   *  По умолчанию false — включается явно в settings. */
  calendarSyncEnabled: boolean;
  /** Язык интерфейса: 'system' = автоматически по системе, иначе явно ru/en. */
  language: 'system' | 'ru' | 'en';
  /** «Уменьшить эффекты» — отключает blur/mesh (сплошные поверхности).
   *  Для слабых/бюджетных Android, где blur роняет FPS при скролле.
   *  Device-preference (как тема) — не сбрасывается при выходе из аккаунта. */
  reduceEffects: boolean;
  /** Вибрация (тактильная отдача). Выключатель для тех, кому мешает —
   *  device-preference (как тема), не сбрасывается при выходе из аккаунта.
   *  По умолчанию включена. Гасит ВСЮ вибрацию через обёртку src/lib/haptics. */
  hapticsEnabled: boolean;
  /** Авто-напоминания клиентам: вечером ежедневно приложение напоминает
   *  мастеру разослать напоминания завтрашним клиентам (тап → экран рассылки
   *  с готовыми WhatsApp-черновиками). Авто-отправка SMS требует платного
   *  шлюза — отложено. Opt-in, по умолчанию выключено. */
  autoClientReminders: boolean;
  /** Шаблон текста напоминания клиенту (мастер задаёт сам). null = дефолт из
   *  i18n. Плейсхолдеры: {имя}/{name}, {время}/{time}, {услуга}/{service}. */
  reminderTemplate: string | null;
  /** Канал по умолчанию для напоминаний: whatsapp | telegram | sms. */
  reminderChannel: 'whatsapp' | 'telegram' | 'sms';

  setTheme: (theme: ThemeSetting) => void;
  setWorkHours: (start: string, end: string) => void;
  setWorkDays: (days: number[]) => void;
  setBreakTime: (breakTime: { enabled: boolean; start: string; end: string }) => void;
  setBufferMinutes: (minutes: number) => void;
  setFieldConfig: (config: FieldConfig) => void;
  updateFieldConfig: (updates: Partial<FieldConfig>) => void;
  setMasterName: (name: string) => void;
  setMasterPhotoUri: (uri: string | null) => void;
  setBiometricLock: (enabled: boolean) => void;
  setPublicProfile: (patch: Partial<{ city: string; district: string; bio: string; published: boolean; slug: string | null; whatsapp: string; publicPhone: string; portfolioPhotos: string[] }>) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setDemoDataSeededAt: (iso: string | null) => void;
  setFirstUseAt: (iso: string | null) => void;
  dismissChecklist: () => void;
  setSwipeHintSeen: () => void;
  setCalendarSyncEnabled: (enabled: boolean) => void;
  setLanguage: (lang: 'system' | 'ru' | 'en') => void;
  setReduceEffects: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setAutoClientReminders: (enabled: boolean) => void;
  setReminderTemplate: (template: string | null) => void;
  setReminderChannel: (channel: 'whatsapp' | 'telegram' | 'sms') => void;
  /** Полный сброс к дефолтам (используется при signOut / deleteAccount).
   *  Сохраняет тему (UI preference) — это про устройство, не про аккаунт.
   *  Валюту тоже сохраняем — она привязана к региону, не к юзеру. */
  reset: () => void;
}

const defaultFieldConfig: FieldConfig = {
  clientAddress: false,
  beforeAfterPhotos: false,
  materials: false,
  extraDescription: { enabled: false, label: '' },
  timeStep: 60,
  durationRange: { min: 30, max: 480 },
};

const defaultSettingsForAccount = {
  workHours: { start: '09:00', end: '20:00' },
  workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  breakTime: { enabled: true, start: '13:00', end: '14:00' },
  bufferMinutes: 15,
  fieldConfig: defaultFieldConfig,
  masterName: '',
  masterPhotoUri: null as string | null,
  biometricLock: false,
  city: '',
  district: '',
  bio: '',
  published: false,
  slug: null as string | null,
  whatsapp: '',
  publicPhone: '',
  portfolioPhotos: [] as string[],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'TJS' as CurrencyCode,
      demoDataSeededAt: null,
      firstUseAt: null,
      checklistDismissedAt: null,
      swipeHintSeen: false,
      calendarSyncEnabled: false,
      language: 'system',
      reduceEffects: false,
      hapticsEnabled: true,
      autoClientReminders: false,
      reminderTemplate: null,
      reminderChannel: 'whatsapp',
      ...defaultSettingsForAccount,

      setTheme: (theme) => set({ theme }),
      setWorkHours: (start, end) => set({ workHours: { start, end } }),
      setWorkDays: (days) => set({ workDays: days }),
      setBreakTime: (breakTime) => set({ breakTime }),
      setBufferMinutes: (minutes) => set({ bufferMinutes: minutes }),
      setFieldConfig: (config) => set({ fieldConfig: config }),
      updateFieldConfig: (updates) =>
        set((s) => ({ fieldConfig: { ...s.fieldConfig, ...updates } })),
      setMasterName: (name) => set({ masterName: name }),
      setMasterPhotoUri: (uri) => set({ masterPhotoUri: uri }),
      setBiometricLock: (enabled) => set({ biometricLock: enabled }),
      setPublicProfile: (patch) => set(patch),
      setCurrency: (currency) => set({ currency }),
      setDemoDataSeededAt: (iso) => set({ demoDataSeededAt: iso }),
      setFirstUseAt: (iso) => set({ firstUseAt: iso }),
      dismissChecklist: () => set({ checklistDismissedAt: new Date().toISOString() }),
      setSwipeHintSeen: () => set({ swipeHintSeen: true }),
      setCalendarSyncEnabled: (enabled) => set({ calendarSyncEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      setReduceEffects: (enabled) => set({ reduceEffects: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setAutoClientReminders: (enabled) => set({ autoClientReminders: enabled }),
      setReminderTemplate: (template) => set({ reminderTemplate: template }),
      setReminderChannel: (channel) => set({ reminderChannel: channel }),

      reset: () =>
        set({
          ...defaultSettingsForAccount,
          demoDataSeededAt: null,
          firstUseAt: null,
          checklistDismissedAt: null,
          calendarSyncEnabled: false,
          autoClientReminders: false,
          reminderTemplate: null,
          reminderChannel: 'whatsapp',
        }),
    }),
    {
      name: 'masterbook-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
