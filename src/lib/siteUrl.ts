// Адрес сайта-каталога — в одном месте. Раньше экран «Опубликовать» давал
// мастеру ссылку masterbook.tj/m/…, а у этого домена нет даже DNS-записи:
// мастер ставил её в Instagram, и клиенты попадали в никуда. Когда появится
// свой домен — поменять только здесь (и в web/app/layout.tsx → SITE_URL).
export const SITE_ORIGIN = 'https://masterbook-app.vercel.app';
/** Без протокола — для показа и копирования ссылки. */
export const SITE_HOST = SITE_ORIGIN.replace(/^https?:\/\//, '');
