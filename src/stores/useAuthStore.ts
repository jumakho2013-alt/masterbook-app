import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import type { ProfessionCategory } from '@/src/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  // Supabase auth
  user: User | null;
  session: Session | null;
  loading: boolean;

  // App state
  onboarded: boolean;
  professionCategory: ProfessionCategory | null;
  specializationId: string | null;

  // Auth actions
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  setSession: (session: Session | null) => void;

  // App actions
  setOnboarded: (value: boolean) => void;
  setProfession: (category: ProfessionCategory, specializationId: string) => void;
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
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          onboarded: false,
          professionCategory: null,
          specializationId: null,
        });
      },

      checkSession: async () => {
        set({ loading: true });
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
      reset: () =>
        set({ onboarded: false, professionCategory: null, specializationId: null }),
    }),
    {
      name: 'masterbook-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        professionCategory: state.professionCategory,
        specializationId: state.specializationId,
      }),
    },
  ),
);
