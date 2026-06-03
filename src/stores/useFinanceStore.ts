import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinanceEntry, FinanceSummary } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { nowIso } from '@/src/utils/date';
import { mergeRemote, type RemoteChange, type Tombstone } from '@/src/lib/syncMerge';
import { notifyLocalMutation } from '@/src/lib/cloudSyncSignal';

interface FinanceState {
  entries: FinanceEntry[];
  tombstones: Tombstone[];

  addEntry: (data: Omit<FinanceEntry, 'id'>) => FinanceEntry;
  deleteEntry: (id: string) => void;
  getByPeriod: (start: string, end: string) => FinanceEntry[];
  getSummary: (start: string, end: string) => FinanceSummary;
  mergeRemote: (remote: RemoteChange<FinanceEntry>[]) => string[];
  clearTombstones: (ids: string[]) => void;
  /** Полный сброс in-memory state (используется при signOut / deleteAccount) */
  reset: () => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      entries: [],
      tombstones: [],

      addEntry: (data) => {
        const entry: FinanceEntry = { ...data, id: generateId(), updatedAt: nowIso() };
        set((s) => ({ entries: [entry, ...s.entries] }));
        notifyLocalMutation();
        return entry;
      },

      deleteEntry: (id) => {
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
          tombstones: [
            ...s.tombstones.filter((t) => t.id !== id),
            { id, deletedAt: nowIso() },
          ],
        }));
        notifyLocalMutation();
      },

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

      mergeRemote: (remote) => {
        const { records, appliedDeletes } = mergeRemote(get().entries, remote);
        set({ entries: records });
        return appliedDeletes;
      },

      clearTombstones: (ids) =>
        set((s) => ({ tombstones: s.tombstones.filter((t) => !ids.includes(t.id)) })),

      reset: () => set({ entries: [], tombstones: [] }),
    }),
    {
      name: 'masterbook-finances',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
