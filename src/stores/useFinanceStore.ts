import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinanceEntry, FinanceSummary } from '@/src/types';
import { generateId } from '@/src/utils/helpers';

interface FinanceState {
  entries: FinanceEntry[];

  addEntry: (data: Omit<FinanceEntry, 'id'>) => FinanceEntry;
  deleteEntry: (id: string) => void;
  getByPeriod: (start: string, end: string) => FinanceEntry[];
  getSummary: (start: string, end: string) => FinanceSummary;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (data) => {
        const entry: FinanceEntry = { ...data, id: generateId() };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      getByPeriod: (start, end) =>
        get()
          .entries.filter((e) => e.date >= start && e.date <= end)
          .sort((a, b) => b.date.localeCompare(a.date)),

      getSummary: (start, end) => {
        const period = get().getByPeriod(start, end);
        const income = period
          .filter((e) => e.type === 'income')
          .reduce((sum, e) => sum + e.amount, 0);
        const expense = period
          .filter((e) => e.type === 'expense')
          .reduce((sum, e) => sum + e.amount, 0);
        return { income, expense, net: income - expense, count: period.length };
      },
    }),
    {
      name: 'masterbook-finances',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
