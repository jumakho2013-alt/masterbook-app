import type { Client, Appointment, FinanceEntry } from '@/src/types';

/**
 * Аналитика бизнеса (минус №6) — чистые функции над данными сторов.
 * Никаких Date.now() внутри: «сегодня» и «текущий месяц» передаём явно, чтобы
 * функции были детерминированы и тестируемы.
 *
 * Деньги считаем по finance income-записям (источник правды по деньгам), а
 * визиты/услуги/день недели — по completed-записям (источник правды по работе).
 */

export interface TopService {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
}

export interface Insights {
  newClientsThisMonth: number;
  completedThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  /** Изменение выручки месяц-к-месяцу в % (null если в прошлом месяце 0). */
  revenueDeltaPct: number | null;
  avgCheck: number;
  /** 0=Вс…6=Сб — самый прибыльный день недели (по completed за всё время). null если нет данных. */
  bestWeekday: number | null;
  bestWeekdayRevenue: number;
  topServices: TopService[];
  totalCompleted: number;
}

/** YYYY-MM из YYYY-MM-DD. */
function monthOf(ymd: string): string {
  return ymd.slice(0, 7);
}

/** День недели (0=Вс) из YYYY-MM-DD без таймзонных сюрпризов. */
function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getDay();
}

export function computeInsights(args: {
  clients: Client[];
  appointments: Appointment[];
  entries: FinanceEntry[];
  /** YYYY-MM текущего месяца. */
  currentMonth: string;
  /** YYYY-MM предыдущего месяца. */
  lastMonth: string;
  serviceNameById?: (id: string) => string | undefined;
}): Insights {
  const { clients, appointments, entries, currentMonth, lastMonth, serviceNameById } = args;

  const newClientsThisMonth = clients.filter(
    (c) => c.createdAt && monthOf(c.createdAt.slice(0, 10)) === currentMonth,
  ).length;

  const completed = appointments.filter((a) => a.status === 'completed');
  const completedThisMonth = completed.filter((a) => monthOf(a.date) === currentMonth).length;

  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  for (const e of entries) {
    if (e.type !== 'income') continue;
    const mo = monthOf(e.date);
    if (mo === currentMonth) revenueThisMonth += e.amount;
    else if (mo === lastMonth) revenueLastMonth += e.amount;
  }

  const revenueDeltaPct =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;

  const avgCheck = completedThisMonth > 0 ? Math.round(revenueThisMonth / completedThisMonth) : 0;

  // Лучший день недели по выручке completed-записей (по их price).
  const byWeekday = new Array(7).fill(0) as number[];
  for (const a of completed) byWeekday[weekdayOf(a.date)] += a.price;
  let bestWeekday: number | null = null;
  let bestWeekdayRevenue = 0;
  byWeekday.forEach((rev, wd) => {
    if (rev > bestWeekdayRevenue) {
      bestWeekdayRevenue = rev;
      bestWeekday = wd;
    }
  });

  // Топ услуг по числу completed-визитов.
  const svcCount = new Map<string, { count: number; revenue: number }>();
  for (const a of completed) {
    const cur = svcCount.get(a.serviceId) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += a.price;
    svcCount.set(a.serviceId, cur);
  }
  const topServices: TopService[] = Array.from(svcCount.entries())
    .map(([serviceId, v]) => ({
      serviceId,
      name: serviceNameById?.(serviceId) ?? 'Услуга',
      count: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 5);

  return {
    newClientsThisMonth,
    completedThisMonth,
    revenueThisMonth,
    revenueLastMonth,
    revenueDeltaPct,
    avgCheck,
    bestWeekday,
    bestWeekdayRevenue,
    topServices,
    totalCompleted: completed.length,
  };
}

export const WEEKDAY_NAMES_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
