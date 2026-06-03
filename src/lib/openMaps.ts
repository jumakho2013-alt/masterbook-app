import { Linking, Platform } from 'react-native';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Open system maps with address + direction routing.
 *
 * Platform-aware:
 *   • iOS: первую очередь Apple Maps (`maps://`), fallback Google Maps
 *     если установлен, иначе web https://maps.google.com.
 *   • Android: Google Maps app (`geo:`) обычно установлен, иначе web.
 *
 * Address принимается как plain string — система сама геокодит.
 * Это идеально для CRM где мастер пишет адрес как угодно («Тверская 5,
 * подъезд 3, домофон 24»).
 */
export async function openAddressInMaps(address: string): Promise<boolean> {
  if (!address.trim()) return false;
  const encoded = encodeURIComponent(address.trim());

  // На iOS — Apple Maps как primary (нативный шарм + работает без Google)
  // На Android — Google Maps app
  const candidates =
    Platform.OS === 'ios'
      ? [
          `maps://?daddr=${encoded}`,
          `comgooglemaps://?daddr=${encoded}`,
          `https://maps.apple.com/?daddr=${encoded}`,
          `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
        ]
      : [
          `google.navigation:q=${encoded}`,
          `geo:0,0?q=${encoded}`,
          `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
        ];

  for (const url of candidates) {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // продолжаем перебирать
    }
  }

  // Если ничего не сработало — пробуем web fallback явно
  try {
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`);
    return true;
  } catch (err) {
    captureException(err, { tag: 'openMaps' });
    return false;
  }
}
