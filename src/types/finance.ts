export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  appointmentId?: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
}
