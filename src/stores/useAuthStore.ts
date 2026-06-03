import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import type { ProfessionCategory } from '@/src/types';
import type { User, Session } from '@supabase/supabase-js';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/**
 * Очистка ВСЕХ in-memory сторов кроме auth — нужна при signOut и deleteAccount
 * чтобы не было cross-account contamination (пользователь A → logout →
 * пользователь B на том же устройстве не должен видеть данные A).
 *
 * Не вызывает auth.reset() — это делается отдельно вокруг этой функции,
 * после вызова supabase.auth.signOut() чтобы избежать гонки с session listener.
 */
function wipeBusinessStores() {
  useClientStore.getState().reset();
  useAppointmentStore.getState().reset();
  useFinanceStore.getState().reset();
  useServiceStore.getState().reset();
  useSettingsStore.getState().reset();
}

interface AuthState {
  // Supabase auth
  user: User | null;
  session: Session | null;
  loading: boolean;

  // App state
  onboarded: boolean;
  professionCategory: ProfessionCategory | null;
  specializationId: string | null;
  /** ISO timestamp согласия на обработку персональных данных (152-ФЗ ст. 9).
   *  null = согласие ещё не дано. Сохраняется в audit-целях — если
   *  Роскомнадзор запросит подтверждение, у нас есть дата. */
  dataConsentGivenAt: string | null;
  /** Local-only режим: пользователь выбрал «Начать без аккаунта». Данные
   *  живут на устройстве, Supabase не используется (даже для auth).
   *  152-ФЗ автоматически OK — данные не покидают устройство.
   *  Может быть переключено позже в setting'ах если юзер захочет sync. */
  localOnlyMode: boolean;

  // Auth actions
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  setSession: (session: Session | null) => void;

  // App actions
  setOnboarded: (value: boolean) => void;
  setProfession: (category: ProfessionCategory, specializationId: string) => void;
  setConsentGiven: (timestamp: string) => void;
  /** Активирует local-only режим: устанавливает флаг + consent timestamp
   *  (юзер согласился перед нажатием) и обходит signup. */
  enableLocalOnly: () => void;
  /** Перезапуск онбординга (выбор профессии заново). НЕ трогает session,
   *  localOnlyMode, consent — юзер остаётся залогиненным, просто проходит
   *  выбор профессии и услуг ещё раз. Используется кнопкой «Сменить
   *  профессию» в Profile. */
  restartOnboarding: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,

      onboarded: false,
      professionCategory: null,
      specializationId: null,
      dataConsentGivenAt: null,
      localOnlyMode: false,

      signUp: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) return { error: error.message };

        // Supabase может не дать сессию если email confirmation включён
        if (data.session) {
          set({ user: data.user, session: data.session });
        } else if (data.user) {
          // Email confirmation required — сразу логиним
          const signInResult = await supabase.auth.signInWithPassword({ email, password });
          if (signInResult.data.session) {
            set({ user: signInResult.data.user, session: signInResult.data.session });
          } else {
            set({ user: data.user, session: null });
          }
        }
        return {};
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        set({ user: data.user, session: data.session });
        return {};
      },

      signOut: async () => {
        // Сначала чистим бизнес-сторы (клиенты/записи/финансы/услуги/настройки)
        // — это включает отмену всех локальных push-напоминаний.
        // Делаем ДО signOut() чтобы listener supabase.auth не успел вызвать
        // checkSession и перерендерить экраны со старыми данными.
        wipeBusinessStores();
        // Local-only mode: сервер не задействован, скипаем supabase.signOut().
        if (!get().localOnlyMode) {
          await supabase.auth.signOut().catch(() => {
            // Если сетевая ошибка — токен всё равно невалидируется на
            // следующий запрос. Не падаем; локальный wipe важнее.
          });
        }
        set({
          user: null,
          session: null,
          onboarded: false,
          professionCategory: null,
          specializationId: null,
          localOnlyMode: false,
        });
      },

      checkSession: async () => {
        set({ loading: true });
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            set({
              user: data.session.user,
              session: data.session,
              loading: false,
            });
          } else {
            set({ user: null, session: null, loading: false });
          }
        } catch {
          // Сеть упала / Supabase unreachable / env невалидный — НЕ зависаем
          // на бесконечном спиннере. Просто считаем что сессии нет, юзер
          // увидит login screen и сможет «Начать без аккаунта».
          set({ user: null, session: null, loading: false });
        }
      },

      setSession: (session) => {
        set({
          user: session?.user ?? null,
          session,
        });
      },

      setOnboarded: (value) => set({ onboarded: value }),
      setProfession: (category, specializationId) =>
        set({ professionCategory: category, specializationId }),
      setConsentGiven: (timestamp) => set({ dataConsentGivenAt: timestamp }),
      enableLocalOnly: () =>
        set({
          localOnlyMode: true,
          dataConsentGivenAt: new Date().toISOString(),
        }),
      restartOnboarding: () =>
        set({
          onboarded: false,
          professionCategory: null,
          specializationId: null,
          // НЕ трогаем: session, localOnlyMode, dataConsentGivenAt, user.
          // Юзер просто заново выбирает профессию.
        }),
      reset: () =>
        set({
          onboarded: false,
          professionCategory: null,
          specializationId: null,
          dataConsentGivenAt: null,
          localOnlyMode: false,
        }),
    }),
    {
      name: 'masterbook-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        professionCategory: state.professionCategory,
        specializationId: state.specializationId,
        dataConsentGivenAt: state.dataConsentGivenAt,
        localOnlyMode: state.localOnlyMode,
      }),
    },
  ),
);
