export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  appointmentId?: string;
  /** ISO момента последнего изменения — для last-write-wins при облачной
   *  синхронизации (см. src/lib/cloudSync.ts). */
  updatedAt?: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
}
