/**
 * Лёгкий мост «стор → синхронизация» без циклического импорта.
 *
 * Стора нельзя импортировать cloudSync.ts напрямую: cloudSync импортирует ВСЕ
 * сторы, получился бы цикл. Поэтому сторы зовут notifyLocalMutation() здесь, а
 * cloudSync регистрирует свой debounced-пуш через setLocalMutationHandler().
 * Пока обработчик не установлен (local-only режим, неавторизован) — вызовы
 * молча игнорируются.
 */

type Handler = () => void;

let handler: Handler | null = null;

/** cloudSync регистрирует сюда debounced scheduledPush при старте авто-синка. */
export function setLocalMutationHandler(fn: Handler | null): void {
  handler = fn;
}

/** Сторы зовут после каждой локальной мутации (add/update/delete). */
export function notifyLocalMutation(): void {
  handler?.();
}
