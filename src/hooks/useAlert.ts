import { useState, useCallback } from 'react';
import type { AlertButton, AlertConfig } from '@/src/components/ui/CustomAlert';

type AlertIcon = 'success' | 'warning' | 'error' | 'info' | 'confirm';

export function useAlert() {
  const [config, setConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
  });

  const show = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      icon?: AlertIcon,
    ) => {
      setConfig({
        visible: true,
        title,
        message,
        buttons,
        icon: icon ?? 'info',
        onDismiss: () => setConfig((c) => ({ ...c, visible: false })),
      });
    },
    [],
  );

  const success = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      show(title, message, [{ text: 'OK', onPress: onOk }], 'success');
    },
    [show],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show(title, message, [{ text: 'OK' }], 'error');
    },
    [show],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'Да',
      destructive = false,
    ) => {
      show(
        title,
        message,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'default',
            onPress: onConfirm,
          },
        ],
        destructive ? 'warning' : 'confirm',
      );
    },
    [show],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      show(title, message, [{ text: 'OK' }], 'info');
    },
    [show],
  );

  const dismiss = useCallback(() => {
    setConfig((c) => ({ ...c, visible: false }));
  }, []);

  return { alertConfig: config, show, success, error, confirm, info, dismiss };
}
