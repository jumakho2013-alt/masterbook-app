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
  /** Блокировка приложения биометрией (Face ID / Touch ID). */
  biometricLock: boolean;
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
  /** Синхронизация записей в системный календарь (iOS Calendar / Google).
   *  По умолчанию false — включается явно в settings. */
  calendarSyncEnabled: boolean;
  /** Язык интерфейса: 'system' = автоматически по системе, иначе явно ru/en. */
  language: 'system' | 'ru' | 'en';
  /** «Уменьшить эффекты» — отключает blur/mesh (сплошные поверхности).
   *  Для слабых/бюджетных Android, где blur роняет FPS при скролле.
   *  Device-preference (как тема) — не сбрасывается при выходе из аккаунта. */
  reduceEffects: boolean;
  /** Авто-напоминания клиентам: вечером ежедневно приложение напоминает
   *  мастеру разослать напоминания завтрашним клиентам (тап → экран рассылки
   *  с готовыми WhatsApp-черновиками). Авто-отправка SMS требует платного
   *  шлюза — отложено. Opt-in, по умолчанию выключено. */
  autoClientReminders: boolean;

  setTheme: (theme: ThemeSetting) => void;
  setWorkHours: (start: string, end: string) => void;
  setWorkDays: (days: number[]) => void;
  setBreakTime: (breakTime: { enabled: boolean; start: string; end: string }) => void;
  setBufferMinutes: (minutes: number) => void;
  setFieldConfig: (config: FieldConfig) => void;
  updateFieldConfig: (updates: Partial<FieldConfig>) => void;
  setMasterName: (name: string) => void;
  setBiometricLock: (enabled: boolean) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setDemoDataSeededAt: (iso: string | null) => void;
  setFirstUseAt: (iso: string | null) => void;
  dismissChecklist: () => void;
  setCalendarSyncEnabled: (enabled: boolean) => void;
  setLanguage: (lang: 'system' | 'ru' | 'en') => void;
  setReduceEffects: (enabled: boolean) => void;
  setAutoClientReminders: (enabled: boolean) => void;
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
  biometricLock: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'RUB' as CurrencyCode,
      demoDataSeededAt: null,
      firstUseAt: null,
      checklistDismissedAt: null,
      calendarSyncEnabled: false,
      language: 'system',
      reduceEffects: false,
      autoClientReminders: false,
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
      setBiometricLock: (enabled) => set({ biometricLock: enabled }),
      setCurrency: (currency) => set({ currency }),
      setDemoDataSeededAt: (iso) => set({ demoDataSeededAt: iso }),
      setFirstUseAt: (iso) => set({ firstUseAt: iso }),
      dismissChecklist: () => set({ checklistDismissedAt: new Date().toISOString() }),
      setCalendarSyncEnabled: (enabled) => set({ calendarSyncEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      setReduceEffects: (enabled) => set({ reduceEffects: enabled }),
      setAutoClientReminders: (enabled) => set({ autoClientReminders: enabled }),

      reset: () =>
        set({
          ...defaultSettingsForAccount,
          demoDataSeededAt: null,
          firstUseAt: null,
          checklistDismissedAt: null,
          calendarSyncEnabled: false,
          autoClientReminders: false,
        }),
    }),
    {
      name: 'masterbook-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
