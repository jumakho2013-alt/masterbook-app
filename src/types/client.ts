export type ClientTag = 'vip' | 'problematic' | 'new';

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes: string;
  tags: ClientTag[];
  address?: string;
  preferences?: string; // любимый цвет, аллергии, предпочтения
  birthday?: string; // YYYY-MM-DD
  debt?: number; // client debt
  photoUri?: string; // фото клиента
  createdAt: string; // ISO
  /** ISO момента последнего изменения. Нужен для last-write-wins при
   *  облачной синхронизации (см. src/lib/cloudSync.ts). */
  updatedAt?: string;
}
