/**
 * IAP / подписка — тонкая обёртка-заглушка (минус №16).
 *
 * v1 (сейчас): no-op. Реальная покупка требует НАТИВНОГО модуля
 * (RevenueCat `react-native-purchases` или `expo-in-app-purchases`) → это
 * EAS-билд + заведённые товары в App Store Connect и Google Play Console.
 * Пока их нет — все вызовы безопасны и возвращают `unavailable`.
 *
 * v2 (когда есть билд + товары):
 *   npx expo install react-native-purchases
 *   Purchases.configure({ apiKey }) в initIap()
 *   getProducts()  → Purchases.getOfferings()
 *   purchasePro()  → Purchases.purchasePackage()
 *   restore()      → Purchases.restorePurchases()
 *   isSubscribed() → проверка entitlement (кешируем в useSettingsStore)
 *
 * Wiring уже на месте: app/settings/subscription.tsx зовёт эти функции.
 * Подписка пока НИЧЕГО не гейтит — приложение полностью бесплатно до запуска
 * монетизации, поэтому isSubscribed() возвращает false (нет premium-замков).
 */

export type PurchaseResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'cancelled' | 'error'; message?: string };

export interface ProProduct {
  id: string;
  title: string;
  /** Готовая к показу строка цены из стора (напр. "299 ₽"). */
  price: string;
  period: 'month' | 'year';
}

let initialized = false;

/** Инициализация SDK покупок. Сейчас no-op. */
export function initIap(): void {
  initialized = true;
}

/** Доступно ли реальное IAP (есть нативный модуль). Пока — нет. */
export function isIapAvailable(): boolean {
  return false;
}

/** Список доступных подписок. Заглушка → пусто (нет нативного модуля). */
export async function getProducts(): Promise<ProProduct[]> {
  return [];
}

/** Покупка подписки. Заглушка → недоступно. */
export async function purchasePro(_productId: string): Promise<PurchaseResult> {
  return { ok: false, reason: 'unavailable' };
}

/** Восстановление покупок. Заглушка → недоступно. */
export async function restorePurchases(): Promise<PurchaseResult> {
  return { ok: false, reason: 'unavailable' };
}

/**
 * Есть ли активная подписка. Пока всегда false — премиум-функций за платой
 * нет, ничего не заблокировано. Когда появится — читать entitlement.
 */
export function isSubscribed(): boolean {
  void initialized;
  return false;
}
