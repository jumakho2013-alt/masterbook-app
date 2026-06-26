'use client';

import { useEffect, useState } from 'react';
import { readSavedCity } from './LocationPicker';
import { DEFAULT_CITY } from '@/lib/geo';

/** Город в заголовке главной: дефолт Душанбе на сервере, после гидратации —
 *  выбранный пользователем (LocationPicker сохраняет в localStorage). */
export function HeroCity() {
  const [city, setCity] = useState(DEFAULT_CITY);
  useEffect(() => { setCity(readSavedCity()); }, []);
  return <>{city}</>;
}
