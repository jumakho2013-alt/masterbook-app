// Форма публичных строк Supabase, которые читает сайт. Совпадает с колонками
// public_catalog_layer (см. supabase-schema.sql в корне репозитория).

export interface Master {
  id: string;
  name: string;
  slug: string | null;
  profession_category: string | null;
  specialization_id: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  portfolio_photos: string[] | null;
  whatsapp: string | null;
  public_phone: string | null;
  premium: boolean;
  premium_until: string | null;
  rating: number;
  reviews_count: number;
  // Рабочее расписание — нужно форме онлайн-записи (work_days: 0=Вс..6=Сб).
  work_days: number[] | null;
  work_hours_start: string | null;
  work_hours_end: string | null;
  // Валюта мастера (TJS/RUB/KZT/…) — цены показываем в ней, а не всегда «сом.».
  currency: string | null;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  price: number;
  duration: number;
  color: string | null;
}

export interface Review {
  id: string;
  master_id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
