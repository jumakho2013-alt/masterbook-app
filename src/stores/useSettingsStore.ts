import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FieldConfig } from '@/src/types';

type ThemeSetting = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeSetting;
  workHours: { start: string; end: string };
  workDays: number[]; // 0=Sun, 1=Mon ... 6=Sat
  breakTime: { enabled: boolean; start: string; end: string };
  bufferMinutes: number; // 0, 15, 30
  fieldConfig: FieldConfig;
  masterName: string;

  setTheme: (theme: ThemeSetting) => void;
  setWorkHours: (start: string, end: string) => void;
  setWorkDays: (days: number[]) => void;
  setBreakTime: (breakTime: { enabled: boolean; start: string; end: string }) => void;
  setBufferMinutes: (minutes: number) => void;
  setFieldConfig: (config: FieldConfig) => void;
  updateFieldConfig: (updates: Partial<FieldConfig>) => void;
  setMasterName: (name: string) => void;
}

const defaultFieldConfig: FieldConfig = {
  clientAddress: false,
  beforeAfterPhotos: false,
  materials: false,
  extraDescription: { enabled: false, label: '' },
  timeStep: 60,
  durationRange: { min: 30, max: 480 },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      workHours: { start: '09:00', end: '20:00' },
      workDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      breakTime: { enabled: true, start: '13:00', end: '14:00' },
      bufferMinutes: 15,
      fieldConfig: defaultFieldConfig,
      masterName: '',

      setTheme: (theme) => set({ theme }),
      setWorkHours: (start, end) => set({ workHours: { start, end } }),
      setWorkDays: (days) => set({ workDays: days }),
      setBreakTime: (breakTime) => set({ breakTime }),
      setBufferMinutes: (minutes) => set({ bufferMinutes: minutes }),
      setFieldConfig: (config) => set({ fieldConfig: config }),
      updateFieldConfig: (updates) =>
        set((s) => ({ fieldConfig: { ...s.fieldConfig, ...updates } })),
      setMasterName: (name) => set({ masterName: name }),
    }),
    {
      name: 'masterbook-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
