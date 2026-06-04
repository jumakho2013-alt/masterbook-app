import * as Contacts from 'expo-contacts';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Импорт клиентов из телефонной книги (фидбэк: «не вбивать каждого руками»).
 * Только ЧТЕНИЕ и только то, что мастер сам выберет — вся книга никуда не
 * уходит. WRITE_CONTACTS заблокирован: мы не меняем контакты пользователя.
 */
export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

/** Только цифры — для сравнения телефонов (дубли) независимо от формата. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    captureException(err, { tag: 'contacts.permission' });
    return false;
  }
}

/** Контакты с именем и хотя бы одним телефоном, отсортированы по имени. */
export async function loadDeviceContacts(): Promise<DeviceContact[]> {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    const out: DeviceContact[] = [];
    const seen = new Set<string>();

    for (const c of data) {
      const name = (
        c.name || [c.firstName, c.lastName].filter(Boolean).join(' ')
      )?.trim();
      const rawPhone = c.phoneNumbers?.[0]?.number;
      if (!name || !rawPhone) continue;

      const phone = rawPhone.replace(/\s+/g, ' ').trim();
      // Дедуп внутри книги по цифрам телефона (один человек — несколько записей).
      const digits = phoneDigits(phone);
      if (!digits || seen.has(digits)) continue;
      seen.add(digits);

      out.push({ id: c.id ?? digits, name, phone });
    }

    return out;
  } catch (err) {
    captureException(err, { tag: 'contacts.load' });
    return [];
  }
}
