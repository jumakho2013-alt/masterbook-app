import { createClient } from '@supabase/supabase-js';
import { secureStorage } from '@/src/lib/secureStorage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase session (access+refresh token, user payload) — самые
// чувствительные локальные данные приложения. Храним в SecureStore:
//   - iOS: Keychain (AES, биометрия-ready, per-app isolation)
//   - Android: Encrypted SharedPreferences (AES-256, isolated per app)
// Обычный AsyncStorage на Android — XML в открытом виде, читается root'ом
// или через `adb pull /data/data/.../shared_prefs/`.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native doesn't have URL
  },
});
