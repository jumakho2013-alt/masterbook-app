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

/** Модель монетизации: 7 дней бесплатно, далее $3.99/мес. Цена показывается
 *  как fallback — на проде реальную локализованную цену вернёт стор. */
export const TRIAL_DAYS = 7;
export const PRO_PRICE = '$3.99';
export const PRO_PRODUCT_ID = 'pro_monthly';

/**
 * Жёсткий paywall включается ТОЛЬКО когда подключён реальный IAP (RevenueCat) —
 * иначе без возможности оплатить мы бы заперли всех. После EAS-билда + товаров
 * в сторах + Purchases.configure(): поставить true. Сейчас false → по истечении
 * триала показываем НЕблокирующий баннер, а не запираем.
 */
export const SUBSCRIPTION_ENFORCED = false;

export type AccessStatus = 'subscribed' | 'trial' | 'expired';

/** Сколько дней триала осталось (отсчёт от firstUseAt). */
export function trialDaysLeft(firstUseAt: string | null): number {
  if (!firstUseAt) return TRIAL_DAYS;
  const elapsed = Math.floor((Date.now() - new Date(firstUseAt).getTime()) / 86400000);
  return Math.max(0, TRIAL_DAYS - elapsed);
}

/** Текущий статус доступа: подписан / в триале / триал истёк. */
export function getAccessStatus(firstUseAt: string | null): AccessStatus {
  if (isSubscribed()) return 'subscribed';
  return trialDaysLeft(firstUseAt) > 0 ? 'trial' : 'expired';
}

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
