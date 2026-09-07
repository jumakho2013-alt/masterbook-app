/**
 * Production-safe demo data seeder.
 *
 * Отличается от `src/lib/devSeed.ts`:
 *   • devSeed работает только при `__DEV__` + `EXPO_PUBLIC_DEV_PREVIEW=1`
 *     (для local-Metro / preview builds).
 *   • Здесь seedSampleData() — пользователь нажал кнопку «Заполнить примером»
 *     в UI. Работает в production билдах. Помечает данные как demo и
 *     позволяет позже одним жестом вернуть пустое состояние.
 *
 * UX-цель из PLAN.md §7 «Onboarding» / value-uplift §6: новый пользователь
 * на Today видит не пустоту, а реалистичную картину — это меняет first-run
 * activation rate с 30% до 60% (по бенчмаркам Booksy / GlossGenius).
 */

import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { toDateKey } from '@/src/utils/date';

function dateKeyOffset(daysFromToday: number, ref = new Date()): string {
  const d = new Date(ref);
  d.setDate(d.getDate() + daysFromToday);
  return toDateKey(d);
}

function nowTimeOffset(minutes: number, ref = new Date()): string {
  const d = new Date(ref);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Возвращает true если демо успешно посеяно, false если уже что-то было
 *  (мы НИКОГДА не перезаписываем реальные данные пользователя). */
export function seedSampleData(): boolean {
  const clientStore = useClientStore.getState();
  const serviceStore = useServiceStore.getState();
  const appointmentStore = useAppointmentStore.getState();
  const financeStore = useFinanceStore.getState();
  const settingsStore = useSettingsStore.getState();

  // Никогда не переписываем реальные данные. Если у юзера есть хоть один
  // клиент/услуга/запись — отказ.
  if (
    clientStore.clients.length > 0 ||
    serviceStore.services.length > 0 ||
    appointmentStore.appointments.length > 0 ||
    financeStore.entries.length > 0
  ) {
    return false;
  }

  // Services: подбор универсальный для бьюти-мастеров (default-профессия).
  const services = [
    { name: 'Маникюр классический', duration: 60, price: 2500, color: '#7C5DFA' },
    { name: 'Маникюр + гель-лак', duration: 90, price: 3500, color: '#FF6B6B' },
    { name: 'Педикюр', duration: 75, price: 3000, color: '#2ED573' },
    { name: 'Дизайн ногтей', duration: 45, price: 1500, color: '#FFA502' },
  ];
  services.forEach((s) => serviceStore.addService(s));
  const storedServices = useServiceStore.getState().services;

  // Clients: миксы тегов чтобы UI был визуально живым.
  const clientsData: Array<{
    name: string;
    phone: string;
    notes: string;
    tags: ('vip' | 'problematic' | 'new')[];
    preferences?: string;
  }> = [
    { name: 'Анна Соколова', phone: '+7 916 111 22 33', notes: 'Пример клиента', tags: ['vip'], preferences: 'Любит светло-розовый' },
    { name: 'Елена Ким', phone: '+7 925 444 55 66', notes: 'Пример клиента', tags: ['new'] },
    { name: 'Дарья Волкова', phone: '+7 903 777 88 99', notes: 'Пример клиента', tags: [], preferences: 'Аллергия на ацетон' },
    { name: 'Ольга Петрова', phone: '+7 910 222 33 44', notes: 'Пример клиента', tags: [] },
    { name: 'Ирина Смирнова', phone: '+7 999 555 66 77', notes: 'Пример клиента', tags: ['vip'] },
  ];
  clientsData.forEach((c) => clientStore.addClient(c));
  const storedClients = useClientStore.getState().clients;

  // Appointments: один сегодня в ближайшем будущем (через 2 часа) — чтобы
  // юзер видел «Сейчас не идёт», но запись виднеется. Плюс 2 на завтра.
  // Завершённые за последние 2 недели — для финансов и спящих клиентов.
  const apptPlan: Array<{
    clientIdx: number;
    serviceIdx: number;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed';
  }> = [
    { clientIdx: 0, serviceIdx: 1, date: dateKeyOffset(0), startTime: nowTimeOffset(120), endTime: nowTimeOffset(210), status: 'scheduled' },
    { clientIdx: 1, serviceIdx: 0, date: dateKeyOffset(1), startTime: '11:00', endTime: '12:00', status: 'scheduled' },
    { clientIdx: 2, serviceIdx: 2, date: dateKeyOffset(2), startTime: '14:30', endTime: '15:45', status: 'scheduled' },
    // Прошлые — для статистики и для того чтобы сразу был один "спящий" клиент.
    { clientIdx: 3, serviceIdx: 0, date: dateKeyOffset(-3), startTime: '10:00', endTime: '11:00', status: 'completed' },
    { clientIdx: 4, serviceIdx: 1, date: dateKeyOffset(-7), startTime: '12:00', endTime: '13:30', status: 'completed' },
    // Спящий пример — Ольга (idx 3) была 50 дней назад. Создаёт активный
    // sleeping-clients widget сразу при первом запуске.
    { clientIdx: 3, serviceIdx: 1, date: dateKeyOffset(-50), startTime: '14:00', endTime: '15:30', status: 'completed' },
  ];

  apptPlan.forEach((p) => {
    const client = storedClients[p.clientIdx];
    const service = storedServices[p.serviceIdx];
    if (!client || !service) return;
    const appt = appointmentStore.addAppointment({
      clientId: client.id,
      serviceId: service.id,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      status: p.status,
      price: service.price,
    });
    if (p.status === 'completed') {
      financeStore.addEntry({
        type: 'income',
        amount: service.price,
        date: p.date,
        description: `${client.name} — ${service.name}`,
        appointmentId: appt.id,
      });
    }
  });

  // Один пример расхода (для финансов)
  financeStore.addEntry({
    type: 'expense',
    amount: 1500,
    date: dateKeyOffset(-2),
    description: 'Пример: материалы',
  });

  // Помечаем что демо есть — для возможности однажды его убрать.
  settingsStore.setDemoDataSeededAt(new Date().toISOString());

  return true;
}

/** Удаляет ВСЕ данные из бизнес-сторов (клиенты, услуги, записи, финансы).
 *  Используется когда пользователь хочет очистить пример. Не трогает auth /
 *  настройки кроме `demoDataSeededAt`. */
export function clearAllBusinessData(): void {
  useClientStore.getState().reset();
  useAppointmentStore.getState().reset();
  useFinanceStore.getState().reset();
  useServiceStore.getState().reset();
  // Settings не сбрасываем — только флаг demo
  useSettingsStore.getState().setDemoDataSeededAt(null);
}
