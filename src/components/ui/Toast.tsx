import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { Check, AlertCircle, Info } from 'lucide-react-native';
import { useTheme } from '@/src/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastStack({ toasts }: { toasts: ToastData[] }) {
  const { colors, typography: typo, borderRadius: br, shadows: sh } = useTheme();

  const ICONS = {
    success: { Icon: Check, color: colors.success },
    error: { Icon: AlertCircle, color: colors.danger },
    info: { Icon: Info, color: colors.primary },
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => {
        const { Icon, color } = ICONS[toast.type];
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutUp.duration(250)}
            style={[
              styles.toast,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: br.lg,
                ...sh.lg,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
              <Icon size={18} color={color} />
            </View>
            <Text
              style={[typo.bodyBold, { color: colors.text, flex: 1 }]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
