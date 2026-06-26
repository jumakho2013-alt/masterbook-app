// География каталога. Страна — это группировка поверх города: мастер задаёт
// город, а страна выводится из города по этой карте. Так клиент из Душанбе не
// видит мастера из Москвы — фильтр по городу уже разделяет их, а выбор «страна →
// город» делает это явным и удобным.
//
// Город — единственное, что реально хранится в profiles.city (free-text в
// приложении, выпадашка в кабинете). Страну НЕ храним в БД — выводим здесь.
// Когда у приложения появится поле страны (build 10), можно будет хранить явно.

export type Country = {
  /** ISO-подобный код для ключей/иконок. */
  code: string;
  name: string;
  /** Курированные города (крупные/частые). Мастер может задать и другой —
   *  такой попадёт в группу «Другие города» внутри своей страны по city, но
   *  без карты — в общий «Другой регион». */
  cities: string[];
};

// Таджикистан первым — домашний рынок и дефолт. Порядок остальных — по размеру
// потенциальной аудитории СНГ.
export const COUNTRIES: ReadonlyArray<Country> = [
  {
    code: 'TJ',
    name: 'Таджикистан',
    cities: [
      'Душанбе', 'Худжанд', 'Бохтар', 'Куляб', 'Истаравшан', 'Турсунзаде',
      'Канибадам', 'Исфара', 'Пенджикент', 'Вахдат', 'Гиссар', 'Яван',
      'Нурек', 'Дангара', 'Хорог',
    ],
  },
  {
    code: 'RU',
    name: 'Россия',
    cities: [
      'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
      'Нижний Новгород', 'Самара', 'Краснодар', 'Ростов-на-Дону', 'Уфа',
      'Красноярск', 'Воронеж', 'Волгоград', 'Сочи', 'Тюмень',
    ],
  },
  {
    code: 'KZ',
    name: 'Казахстан',
    cities: [
      'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз',
      'Павлодар', 'Усть-Каменогорск', 'Атырау', 'Костанай',
    ],
  },
  {
    code: 'UZ',
    name: 'Узбекистан',
    cities: [
      'Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан', 'Фергана',
      'Нукус', 'Карши', 'Коканд', 'Маргилан',
    ],
  },
  {
    code: 'KG',
    name: 'Кыргызстан',
    cities: ['Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок', 'Узген'],
  },
];

export const DEFAULT_COUNTRY = 'Таджикистан';
export const DEFAULT_CITY = 'Душанбе';

/** Нормализация города для сравнения (регистр, ё→е, пробелы/дефисы). */
function normCity(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е').replace(/[\s-]+/g, ' ');
}

// Город → название страны. Строим один раз (модуль кэшируется рантаймом).
const CITY_TO_COUNTRY = new Map<string, string>();
for (const c of COUNTRIES) {
  for (const city of c.cities) CITY_TO_COUNTRY.set(normCity(city), c.name);
}

/** В какой стране город. null — если город не в карте (мелкий/нестандартный). */
export function countryOfCity(city: string | null | undefined): string | null {
  if (!city) return null;
  return CITY_TO_COUNTRY.get(normCity(city)) ?? null;
}

export function countryByName(name: string | null | undefined): Country | null {
  if (!name) return null;
  return COUNTRIES.find((c) => c.name === name) ?? null;
}

/** Сгруппировать произвольный список городов (из БД) по странам, сохранив
 *  порядок стран из COUNTRIES; неизвестные города — в «Другие регионы». */
export function groupCitiesByCountry(
  cities: string[],
): Array<{ country: string; cities: string[] }> {
  const byCountry = new Map<string, string[]>();
  const OTHER = 'Другие регионы';
  for (const city of cities) {
    const country = countryOfCity(city) ?? OTHER;
    const arr = byCountry.get(country) ?? [];
    arr.push(city);
    byCountry.set(country, arr);
  }
  const ordered: Array<{ country: string; cities: string[] }> = [];
  for (const c of COUNTRIES) {
    const list = byCountry.get(c.name);
    if (list && list.length) ordered.push({ country: c.name, cities: list });
  }
  const other = byCountry.get(OTHER);
  if (other && other.length) ordered.push({ country: OTHER, cities: other });
  return ordered;
}
