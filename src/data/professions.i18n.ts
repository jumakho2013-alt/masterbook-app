import { i18n } from '@/src/i18n';
import type { ProfessionCategoryInfo, Specialization } from '@/src/types';

/**
 * EN-перевод названий профессий/специализаций/доп-полей. RU — в professions.ts
 * (источник правды). Здесь только EN по id; нет перевода → fallback на RU.
 * Резолверы читают текущий i18n.locale (без цикла: i18n не импортит data).
 */
const CATEGORY_EN: Record<string, string> = {
  beauty: 'Beauty',
  health: 'Health',
  repair: 'Repair & service',
  education: 'Education',
  photo: 'Photo & creative',
  auto: 'Auto',
  home: 'Home & household',
  pets: 'Pets',
  events: 'Events',
  handmade: 'Handmade & food',
  other: 'Other',
};

const SPEC_EN: Record<string, string> = {
  // beauty
  nails: 'Manicure',
  hair: 'Hairdresser',
  lashes: 'Lashes',
  brows: 'Brows',
  cosmetology: 'Cosmetologist',
  makeup: 'Makeup artist',
  depilation: 'Waxing / sugaring',
  tattoo: 'Tattoo artist',
  stylist: 'Stylist',
  // health
  massage: 'Massage therapist',
  psychologist: 'Psychologist',
  osteopath: 'Osteopath',
  nutritionist: 'Nutritionist',
  speech: 'Speech therapist',
  // repair
  electrician: 'Electrician',
  plumber: 'Plumber',
  handyman: 'Repair handyman',
  furniture: 'Furniture assembly',
  ac_repair: 'Air conditioners',
  locksmith: 'Locks & doors',
  painter: 'Painter',
  tiler: 'Tiler',
  // education
  tutor: 'Tutor',
  trainer: 'Trainer',
  instructor: 'Instructor',
  coach: 'Coach',
  music_teacher: 'Music teacher',
  dance: 'Dance',
  // photo
  photographer: 'Photographer',
  videographer: 'Videographer',
  designer: 'Designer',
  smm: 'SMM specialist',
  target: 'Targeting specialist',
  // auto
  mechanic: 'Auto mechanic',
  detailing: 'Detailing',
  carwash: 'Car wash',
  tinting: 'Tinting',
  tire: 'Tire service',
  // home
  cleaning: 'Cleaning',
  nanny: 'Nanny',
  gardener: 'Gardener',
  cook: 'Home cook',
  moving: 'Moving / freight',
  // pets
  groomer: 'Groomer',
  dog_trainer: 'Dog trainer',
  pet_sitter: 'Pet boarding',
  vet: 'Veterinarian',
  // events
  host: 'Host / MC',
  animator: 'Animator',
  dj: 'DJ',
  decorator: 'Decorator',
  baker: 'Custom cakes',
  // handmade
  cakes: 'Custom cakes',
  baking: 'Home baking',
  candles: 'Candles / soap',
  florist: 'Florist / bouquets',
  knitting: 'Knitting / sewing',
  jewelry: 'Jewelry',
  pottery: 'Pottery',
  resin: 'Epoxy resin',
  // other
  custom: 'Free setup',
};

const isEn = () => i18n.locale?.startsWith('en');

export function localizeCategoryName(cat: Pick<ProfessionCategoryInfo, 'id' | 'name'>): string {
  return isEn() ? (CATEGORY_EN[cat.id] ?? cat.name) : cat.name;
}

export function localizeSpecName(spec: Pick<Specialization, 'id' | 'name'>): string {
  return isEn() ? (SPEC_EN[spec.id] ?? spec.name) : spec.name;
}
