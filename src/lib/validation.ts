import { z } from 'zod';

/**
 * Shared Zod schemas used at UI trust boundaries — form submissions and
 * before persisting any record to AsyncStorage / Supabase. Types are inferred
 * from the schemas so the compiler catches drift between validation and state.
 */

const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;
const phone = /^[+\d][\d\s()-]{5,}$/;

export const timeString = z.string().regex(hhmm, 'Время в формате ЧЧ:ММ');
export const dateKey = z.string().regex(yyyymmdd, 'Дата в формате YYYY-MM-DD');

export const appointmentSchema = z
  .object({
    clientId: z.string().min(1, 'Клиент обязателен'),
    serviceId: z.string().min(1, 'Услуга обязательна'),
    date: dateKey,
    startTime: timeString,
    endTime: timeString,
    price: z.number().nonnegative('Цена не может быть отрицательной').finite(),
    notes: z.string().max(500).optional(),
    address: z.string().max(200).optional(),
  })
  .refine(
    (v) => v.endTime > v.startTime,
    { message: 'Время окончания должно быть позже начала', path: ['endTime'] },
  );

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(80, 'Слишком длинное имя'),
  phone: z
    .string()
    .trim()
    .regex(phone, 'Некорректный телефон')
    .or(z.literal(''))
    .transform((v) => v ?? ''),
  notes: z.string().max(1000).optional().default(''),
  address: z.string().max(200).optional(),
  preferences: z.string().max(500).optional(),
  birthday: dateKey.optional().or(z.literal('')).transform((v) => v || undefined),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(80),
  price: z.number().nonnegative('Цена не может быть отрицательной').finite(),
  duration: z
    .number()
    .int('Длительность в минутах')
    .min(5, 'Минимум 5 минут')
    .max(24 * 60, 'Слишком много'),
  color: z.string().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Некорректный e-mail');

export const passwordSchema = z
  .string()
  .min(6, 'Минимум 6 символов')
  .max(72, 'Слишком длинный пароль');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, 'Укажите имя').max(80),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
