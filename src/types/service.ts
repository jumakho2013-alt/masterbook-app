export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  color: string;
  /** ISO момента последнего изменения — для last-write-wins при облачной
   *  синхронизации (см. src/lib/cloudSync.ts). */
  updatedAt?: string;
}
