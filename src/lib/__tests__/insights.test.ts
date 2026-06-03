import { computeInsights } from '../insights';
import type { Client, Appointment, FinanceEntry } from '@/src/types';

const client = (id: string, createdAt: string): Client => ({
  id,
  name: id,
  phone: '',
  notes: '',
  tags: [],
  createdAt,
});
const appt = (id: string, serviceId: string, date: string, price: number, status: Appointment['status'] = 'completed'): Appointment => ({
  id,
  clientId: 'c',
  serviceId,
  date,
  startTime: '10:00',
  endTime: '11:00',
  status,
  price,
});
const income = (id: string, date: string, amount: number): FinanceEntry => ({
  id,
  type: 'income',
  amount,
  description: '',
  date,
});

describe('computeInsights', () => {
  const base = {
    currentMonth: '2026-06',
    lastMonth: '2026-05',
    serviceNameById: (id: string) => ({ s1: 'Маникюр', s2: 'Педикюр' }[id]),
  };

  it('counts new clients in the current month only', () => {
    const r = computeInsights({
      ...base,
      clients: [client('a', '2026-06-02T00:00:00Z'), client('b', '2026-05-30T00:00:00Z')],
      appointments: [],
      entries: [],
    });
    expect(r.newClientsThisMonth).toBe(1);
  });

  it('splits revenue by month and computes delta %', () => {
    const r = computeInsights({
      ...base,
      clients: [],
      appointments: [],
      entries: [income('1', '2026-06-10', 2000), income('2', '2026-06-20', 1000), income('3', '2026-05-15', 1500)],
    });
    expect(r.revenueThisMonth).toBe(3000);
    expect(r.revenueLastMonth).toBe(1500);
    expect(r.revenueDeltaPct).toBe(100);
  });

  it('delta is null when last month had no revenue', () => {
    const r = computeInsights({ ...base, clients: [], appointments: [], entries: [income('1', '2026-06-10', 2000)] });
    expect(r.revenueDeltaPct).toBeNull();
  });

  it('picks best weekday by completed revenue and ranks top services', () => {
    // 2026-06-01 is Monday(1), 2026-06-06 Saturday(6)
    const r = computeInsights({
      ...base,
      clients: [],
      appointments: [
        appt('a1', 's1', '2026-06-01', 1000),
        appt('a2', 's1', '2026-06-08', 1000), // Monday again
        appt('a3', 's2', '2026-06-06', 5000), // Saturday
        appt('a4', 's2', '2026-06-06', 500, 'scheduled'), // not completed → ignored
      ],
      entries: [],
    });
    expect(r.bestWeekday).toBe(6); // Saturday biggest single-day revenue (5000)
    expect(r.topServices[0].serviceId).toBe('s1'); // 2 completed visits
    expect(r.topServices[0].count).toBe(2);
    expect(r.totalCompleted).toBe(3);
  });

  it('avgCheck = revenueThisMonth / completedThisMonth', () => {
    const r = computeInsights({
      ...base,
      clients: [],
      appointments: [appt('a1', 's1', '2026-06-01', 0), appt('a2', 's1', '2026-06-02', 0)],
      entries: [income('1', '2026-06-01', 3000)],
    });
    expect(r.completedThisMonth).toBe(2);
    expect(r.avgCheck).toBe(1500);
  });
});
