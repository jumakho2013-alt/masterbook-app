import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { formatCurrency } from '@/src/utils/currency';

/**
 * Налоговый PDF-отчёт для самозанятого (НПД 4%).
 *
 * НЕ заменяет официальную "Справку о доходах" из приложения «Мой Налог»
 * (КНД 1122036) — её даёт только ФНС. Наш PDF — это вспомогательный
 * документ, помогающий мастеру:
 *   1. сверить свои фактические записи с тем что показывает «Мой Налог»;
 *   2. показать клиенту/банку источник дохода (например, для ипотеки);
 *   3. вести собственный учёт в случае спорных ситуаций.
 *
 * В тексте PDF честно сказано что это самостоятельный учёт, не
 * официальная справка ФНС — это критично юридически.
 */

export interface TaxReportRange {
  /** YYYY-MM-DD — начало периода включительно */
  start: string;
  /** YYYY-MM-DD — конец периода включительно */
  end: string;
}

export interface TaxReportRow {
  date: string;        // YYYY-MM-DD
  clientName: string;  // имя клиента или "—"
  serviceName: string; // имя услуги или описание
  amount: number;
}

export interface TaxReportData {
  masterName: string;
  range: TaxReportRange;
  rows: TaxReportRow[];
  totalIncome: number;
  count: number;
  /** ставка налога для индикативного расчёта (НПД для физлиц по умолчанию) */
  taxRate: number;
  taxIndicative: number;
  generatedAt: string; // ISO
}

/** Собирает данные за период из существующих сторов. */
export function collectTaxReportData(range: TaxReportRange): TaxReportData {
  const masterName = useSettingsStore.getState().masterName || 'Самозанятый мастер';
  const entries = useFinanceStore.getState().entries;
  const appointments = useAppointmentStore.getState().appointments;
  const clients = useClientStore.getState().clients;
  const services = useServiceStore.getState().services;

  // Сначала берём доходы из FinanceStore (явные записи о доходе).
  const incomeEntries = entries.filter(
    (e) => e.type === 'income' && e.date >= range.start && e.date <= range.end,
  );

  const rows: TaxReportRow[] = incomeEntries.map((e) => {
    // Если запись привязана к appointment — подтягиваем имена для читаемости.
    let clientName = '—';
    let serviceName = e.description || 'Доход';
    if (e.appointmentId) {
      const appt = appointments.find((a) => a.id === e.appointmentId);
      if (appt) {
        const client = clients.find((c) => c.id === appt.clientId);
        const service = services.find((s) => s.id === appt.serviceId);
        if (client) clientName = client.name;
        if (service) serviceName = service.name;
      }
    }
    return {
      date: e.date,
      clientName,
      serviceName,
      amount: e.amount,
    };
  });

  // Если явных доходов нет — fallback на completed appointments периода
  // (типичный соло-мастер: оплату не вводит как finance, а отмечает завершение).
  if (rows.length === 0) {
    for (const a of appointments) {
      if (
        a.status === 'completed' &&
        a.date >= range.start &&
        a.date <= range.end
      ) {
        const client = clients.find((c) => c.id === a.clientId);
        const service = services.find((s) => s.id === a.serviceId);
        rows.push({
          date: a.date,
          clientName: client?.name ?? '—',
          serviceName: service?.name ?? 'Услуга',
          amount: a.price,
        });
      }
    }
  }

  // Сортировка по дате ascending — налоговый формат
  rows.sort((a, b) => a.date.localeCompare(b.date));

  const totalIncome = rows.reduce((sum, r) => sum + r.amount, 0);
  // НПД: 4% при работе с физлицами. Реальная ставка зависит от того
  // юрлицо или физлицо, но для соло-мастера в 95% случаев это 4%.
  const taxRate = 0.04;
  const taxIndicative = Math.round(totalIncome * taxRate);

  return {
    masterName,
    range,
    rows,
    totalIncome,
    count: rows.length,
    taxRate,
    taxIndicative,
    generatedAt: new Date().toISOString(),
  };
}

/** Эскейп для значений из user-input — имена клиентов / услуг попадают в HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateRu(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-');
  if (!y || !m || !d) return yyyyMmDd;
  return `${d}.${m}.${y}`;
}

/** Рендерит самодостаточный HTML — expo-print запускает headless WebKit
 *  и конвертирует его в PDF. Никаких внешних шрифтов / картинок — чтобы
 *  работало 100% оффлайн. */
export function renderTaxReportHtml(data: TaxReportData): string {
  const rowsHtml = data.rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #E5E5EA;">${formatDateRu(r.date)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #E5E5EA;">${escapeHtml(r.clientName)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #E5E5EA;">${escapeHtml(r.serviceName)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #E5E5EA;text-align:right;font-variant-numeric:tabular-nums;">${formatCurrency(r.amount)}</td>
      </tr>`,
    )
    .join('');

  const emptyHtml =
    data.rows.length === 0
      ? `<tr><td colspan="4" style="padding:24px 6px;text-align:center;color:#8A8A9E;">За указанный период доходов не зарегистрировано.</td></tr>`
      : '';

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Отчёт о доходах</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      color: #13131A;
      margin: 0;
      padding: 32px;
      font-size: 12px;
      line-height: 1.45;
    }
    h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.3px; }
    h2 { font-size: 15px; margin: 24px 0 8px; color: #13131A; }
    .muted { color: #8A8A9E; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th {
      text-align: left;
      padding: 8px 6px;
      border-bottom: 2px solid #13131A;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    th.amount, td.amount { text-align: right; font-variant-numeric: tabular-nums; }
    .totalbox {
      margin-top: 16px;
      padding: 14px 16px;
      background: #F4F2EE;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .totalbox .label { font-size: 11px; color: #8A8A9E; text-transform: uppercase; letter-spacing: 0.5px; }
    .totalbox .value { font-size: 22px; font-weight: 700; letter-spacing: -0.4px; font-variant-numeric: tabular-nums; }
    .disclaimer {
      margin-top: 28px;
      padding: 12px 14px;
      border-left: 3px solid #F7B500;
      background: #FFF8E5;
      color: #6B5300;
      font-size: 11px;
      line-height: 1.5;
      border-radius: 4px;
    }
    .footer {
      margin-top: 24px;
      color: #B0B0C0;
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Отчёт о доходах</h1>
  <div class="muted">
    Мастер: <strong style="color:#13131A;">${escapeHtml(data.masterName)}</strong> ·
    Период: ${formatDateRu(data.range.start)} — ${formatDateRu(data.range.end)} ·
    Сформирован: ${formatDateRu(data.generatedAt.slice(0, 10))}
  </div>

  <h2>Записи (${data.count})</h2>
  <table>
    <thead>
      <tr>
        <th style="width:90px;">Дата</th>
        <th>Клиент</th>
        <th>Услуга</th>
        <th class="amount" style="width:110px;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}${emptyHtml}
    </tbody>
  </table>

  <div class="totalbox">
    <div>
      <div class="label">Итого доход за период</div>
      <div class="muted" style="margin-top:2px;">${data.count} ${declOf(data.count, 'запись', 'записи', 'записей')}</div>
    </div>
    <div class="value">${formatCurrency(data.totalIncome)}</div>
  </div>

  <div class="totalbox" style="background:#EEF4FF;margin-top:8px;">
    <div>
      <div class="label">НПД 4% (индикативно)</div>
      <div class="muted" style="margin-top:2px;">для расчётов с физлицами</div>
    </div>
    <div class="value" style="color:#3C6FF0;">${formatCurrency(data.taxIndicative)}</div>
  </div>

  <div class="disclaimer">
    <strong>Это вспомогательный документ для вашего личного учёта.</strong><br/>
    Он не заменяет официальную «Справку о доходах» (КНД 1122036) из
    приложения «Мой Налог» — её нужно запрашивать в ФНС. Здесь показаны
    данные, которые мастер вводил в MasterBook за выбранный период.
  </div>

  <div class="footer">
    Создано в MasterBook · ${formatDateRu(data.generatedAt.slice(0, 10))}
  </div>
</body>
</html>`;
}

function declOf(n: number, one: string, few: string, many: string): string {
  // Русские склонения: 1, 2-4, 5-20, 21, 22-24, 25-30 …
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Генерирует PDF и открывает Share sheet. */
export async function generateAndShareTaxReport(
  range: TaxReportRange,
): Promise<{ ok: true; uri: string } | { ok: false; error: string }> {
  try {
    const data = collectTaxReportData(range);
    const html = renderTaxReportHtml(data);
    const { uri } = await Print.printToFileAsync({ html });

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      // Sharing недоступен — возвращаем uri, UI может показать путь.
      return { ok: true, uri };
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Отчёт о доходах',
      UTI: 'com.adobe.pdf',
    });
    return { ok: true, uri };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Утилита для UI: первый и последний день текущего месяца как YYYY-MM-DD. */
export function currentMonthRange(reference = new Date()): TaxReportRange {
  const y = reference.getFullYear();
  const m = reference.getMonth(); // 0-based
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0); // последний день месяца
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: fmt(first), end: fmt(last) };
}
