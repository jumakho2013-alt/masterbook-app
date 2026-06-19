import { createClient } from '@supabase/supabase-js';
import { secureStorage } from '@/src/lib/secureStorage';

// EXPO_PUBLIC_* инлайнятся в бандл при сборке. Если их забыли прокинуть в
// EAS-сборку (eas.json → build.<profile>.env, либо EAS env vars), они будут
// undefined. РАНЬШЕ это роняло ВСЁ приложение на СТАРТЕ: createClient(undefined,
// ...) синхронно бросает "supabaseUrl is required" прямо при импорте этого
// модуля, а его тянет app/index.tsx (точка входа) → мгновенный краш на запуске.
// Теперь: не валим приложение. Если env нет — подставляем заведомо нерабочий
// placeholder (createClient не бросает на непустой строке), приложение
// стартует в локальном режиме (без аккаунта), а облачные вызовы отваливаются
// обычной сетевой ошибкой, которую ловят вызывающие (useAuthStore / cloudSync).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** true — если облачные креды реально прокинуты в сборку (есть бэкенд). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY не заданы ' +
      'в сборке — облачная синхронизация недоступна, работает только локальный режим.',
  );
}

// Supabase session (access+refresh token, user payload) — самые
// чувствительные локальные данные приложения. Храним в SecureStore:
//   - iOS: Keychain (AES, биометрия-ready, per-app isolation)
//   - Android: Encrypted SharedPreferences (AES-256, isolated per app)
// Обычный AsyncStorage на Android — XML в открытом виде, читается root'ом
// или через `adb pull /data/data/.../shared_prefs/`.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.invalid',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // React Native doesn't have URL
    },
  },
);
