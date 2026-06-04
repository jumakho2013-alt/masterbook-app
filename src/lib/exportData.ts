import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/**
 * Экспорт всех данных пользователя в единый JSON — требование GDPR
 * «right to data portability» и общий хороший тон для CRM-приложений.
 *
 * Формат самоописательный: поле `schema` позволяет будущим версиям парсить
 * назад корректно, `exportedAt` — для атрибуции.
 */
export interface ExportPayload {
  schema: 'masterbook-export@1';
  exportedAt: string;
  settings: Record<string, unknown>;
  clients: ReturnType<typeof useClientStore.getState>['clients'];
  services: ReturnType<typeof useServiceStore.getState>['services'];
  appointments: ReturnType<typeof useAppointmentStore.getState>['appointments'];
  financeEntries: ReturnType<typeof useFinanceStore.getState>['entries'];
}

export function buildExportPayload(): ExportPayload {
  // Берём snapshots стора как plain-объекты. Функции-экшны фильтруем
  // чтобы JSON не раздувался и не ломался при reviving на другом устройстве.
  const settingsState = useSettingsStore.getState();
  const settings = Object.fromEntries(
    Object.entries(settingsState).filter(([, v]) => typeof v !== 'function'),
  );

  return {
    schema: 'masterbook-export@1',
    exportedAt: new Date().toISOString(),
    settings,
    clients: useClientStore.getState().clients,
    services: useServiceStore.getState().services,
    appointments: useAppointmentStore.getState().appointments,
    financeEntries: useFinanceStore.getState().entries,
  };
}

/**
 * Пишет JSON во временную директорию и открывает Share sheet.
 * На iOS пользователь получит сохранить в «Файлы», отправить в почту,
 * AirDrop и т.д. На Android — Intent.ACTION_SEND.
 */
export async function exportDataToFile(): Promise<
  { ok: true; path: string } | { ok: false; error: string }
> {
  try {
    const payload = buildExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `masterbook-export-${dateStamp}.json`;

    // Новый File API в expo-file-system — конструктор принимает Directory +
    // сегменты пути. Сохраняем в cache (система сама чистит при нехватке
    // места, документ не появится в Files app лишним хламом).
    const file = new File(Paths.cache, fileName);
    if (file.exists) file.delete();
    file.create();
    file.write(json, { encoding: 'utf8' });

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { ok: false, error: 'Share-лист недоступен на этом устройстве' };
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Экспорт данных MasterBook',
      UTI: 'public.json',
    });
    return { ok: true, path: file.uri };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
