// Гео-справочник для приложения. Списки городов ДОЛЖНЫ совпадать с web/lib/geo.ts —
// чтобы город, выбранный мастером в приложении, точно матчился с фильтром каталога
// на сайте (там eq('city', ...) + группировка по странам по той же карте).

export type Country = { code: string; name: string; cities: string[] };

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

function normCity(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е').replace(/[\s-]+/g, ' ');
}

const CITY_TO_COUNTRY = new Map<string, string>();
for (const c of COUNTRIES) {
  for (const city of c.cities) CITY_TO_COUNTRY.set(normCity(city), c.name);
}

/** В какой стране город (по карте). null — если город не из списка. */
export function countryOfCity(city: string | null | undefined): string | null {
  if (!city) return null;
  return CITY_TO_COUNTRY.get(normCity(city)) ?? null;
}

export function countryByName(name: string | null | undefined): Country | null {
  if (!name) return null;
  return COUNTRIES.find((c) => c.name === name) ?? null;
}
