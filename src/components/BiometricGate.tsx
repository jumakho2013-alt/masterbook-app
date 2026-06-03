import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState, type AppStateStatus, Pressable } from 'react-native';
import { Fingerprint, ScanFace } from 'lucide-react-native';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';
import { useTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { authenticate, biometricLabel, getBiometricKind, type BiometricKind } from '@/src/lib/biometric';

/**
 * BiometricGate — показывает непрозрачный lock-screen поверх всего
 * приложения, когда:
 *   - пользователь включил `biometricLock` в настройках
 *   - есть активная сессия (иначе лочить нечего — пускаем на login)
 *   - приложение только что вернулось из фонового режима (или первый запуск)
 *
 * Поведение специально «всегда при переходе в active» — так CRM защищён от
 * того, что кто-то подглядит данные клиентов, пока мастер отошёл.
 */
export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const session = useAuthStore((s) => s.session);

  const signOut = useAuthStore((s) => s.signOut);

  const [kind, setKind] = useState<BiometricKind>('unknown');
  const [locked, setLocked] = useState<boolean>(() => biometricLock && !!session);
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);
  // Защита от race-condition: если authenticate() ещё не завершён, второй
  // вызов unlock() (например, из AppState listener + useEffect одновременно)
  // создаст параллельный prompt — на iOS это приводит к моментальному
  // ошибочному отказу обоих, на Android к "Authentication busy".
  const inFlightRef = useRef(false);
  // Окно подавления авто-перелока. Сам системный prompt уводит приложение в
  // background и возвращает в active — без этого окна AppState-listener
  // мгновенно перелочил бы экран ПОСЛЕ успешной разблокировки (юзер вводит
  // пароль → разблок → тут же снова просит пароль → бесконечная петля).
  const suppressRelockUntilRef = useRef(0);

  // Определяем тип биометрии для лейблов и иконки. Не блокируем — пока идёт
  // определение, lock-screen просто покажет дефолтный текст.
  useEffect(() => {
    getBiometricKind().then(setKind);
  }, []);

  // Lock-state следует за настройкой и наличием сессии. ВАЖНО: если сессии
  // нет (например, юзер нажал «Выйти» на самом lock-экране) — снимаем блок,
  // иначе человек остаётся заперт на пустом экране без выхода.
  useEffect(() => {
    setLocked(biometricLock && !!session);
  }, [biometricLock, session]);

  // Повторно запрашиваем биометрию каждый раз, когда приложение возвращается
  // из background в active. Expo Go и Production одинаково эмитит события.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = lastStateRef.current;
      lastStateRef.current = next;
      if (!biometricLock) return;
      if (!session) return;
      // Переход в background/inactive вызван НАШИМ же системным prompt'ом —
      // не перелочиваем (иначе петля после успешной разблокировки).
      if (inFlightRef.current) return;
      if (Date.now() < suppressRelockUntilRef.current) return;
      // background/inactive → active
      if ((prev === 'background' || prev === 'inactive') && next === 'active') {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [biometricLock, session]);

  const unlock = useCallback(async () => {
    // Guard: один in-flight prompt в любой момент времени.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await authenticate(`Вход по ${biometricLabel(kind)}`);
      if (res.success) {
        // Гасим возможный «хвостовой» переход в active от закрытия prompt'а,
        // чтобы listener не перелочил экран сразу после успеха.
        suppressRelockUntilRef.current = Date.now() + 2000;
        setLocked(false);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [kind]);

  // Автоматически вызываем prompt при монтировании экрана — чтобы
  // пользователю не нужно было тапать «Разблокировать».
  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  if (!locked) return <>{children}</>;

  const Icon = kind === 'face' ? ScanFace : Fingerprint;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLabel="Экран блокировки">
      <MasterBookLogo size={96} />

      <Text style={[typo.h2, { color: colors.text, marginTop: sp.lg }]}>MasterBook</Text>
      <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs, textAlign: 'center' }]}>
        Приложение заблокировано
      </Text>

      <Pressable
        onPress={unlock}
        accessibilityRole="button"
        accessibilityLabel={`Разблокировать через ${biometricLabel(kind)}`}
        style={[styles.unlockBtn, { backgroundColor: colors.primary, borderRadius: br.md, marginTop: sp.xl }]}
      >
        <Icon size={22} color={colors.white} />
        <Text style={[typo.bodyBold, { color: colors.white, marginLeft: 10 }]}>
          Разблокировать
        </Text>
      </Pressable>

      {/* Аварийный выход: если биометрия/пароль не срабатывают — не оставляем
          человека запертым. «Выйти» очищает сессию → откроется экран входа.
          Данные в облаке (если синхронизация была) сохранятся. */}
      <Pressable
        onPress={() => signOut()}
        accessibilityRole="button"
        accessibilityLabel="Выйти из аккаунта"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ marginTop: sp.lg }}
      >
        <Text style={[typo.caption, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
          Не получается войти? Выйти из аккаунта
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
});
