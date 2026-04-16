/**
 * Dev-only seeder — заполняет сторы демо-данными чтобы UI (Liquid Glass,
 * статистика, «Сейчас идёт») было на чём посмотреть.
 *
 * Срабатывает ТОЛЬКО при одновременном выполнении:
 *   - __DEV__ === true
 *   - EXPO_PUBLIC_DEV_PREVIEW === '1' (явный opt-in в .env.local)
 *   - сторы пустые (не перетираем реальные данные)
 *
 * Никаких heuristic по URL: production-билд не засеит даже если забудут
 * выставить переменную окружения.
 */

import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { toDateKey } from '@/src/utils/date';

function toDateKeyOffset(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return toDateKey(d);
}

function nowTimeOffset(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function seedDevDataIfNeeded() {
  if (!__DEV__) return;
  if (process.env.EXPO_PUBLIC_DEV_PREVIEW !== '1') return;

  const clientStore = useClientStore.getState();
  const serviceStore = useServiceStore.getState();
  const appointmentStore = useAppointmentStore.getState();
  const authStore = useAuthStore.getState();
  const settingsStore = useSettingsStore.getState();
  const financeStore = useFinanceStore.getState();

  // Onboarding — перескакиваем welcome/profession
  if (!authStore.onboarded) {
    authStore.setOnboarded(true);
    authStore.setProfession('beauty', 'manicure');
  }
  if (!settingsStore.masterName) {
    settingsStore.setMasterName('Мария');
  }

  // Если что-то уже есть — не трогаем
  const alreadySeeded =
    clientStore.clients.length > 0 ||
    serviceStore.services.length > 0 ||
    appointmentStore.appointments.length > 0;
  if (alreadySeeded) return;

  // Services
  const services = [
    { name: 'Маникюр классический', duration: 60, price: 2500, color: '#7C5DFA' },
    { name: 'Маникюр + гель-лак', duration: 90, price: 3500, color: '#FF6B6B' },
    { name: 'Педикюр', duration: 75, price: 3000, color: '#2ED573' },
    { name: 'Дизайн ногтей', duration: 45, price: 1500, color: '#FFA502' },
  ];
  services.forEach((s) => serviceStore.addService(s));
  const storedServices = useServiceStore.getState().services;

  // Clients
  const clientsData = [
    { name: 'Анна Соколова', phone: '+7 916 111 22 33', notes: 'Любит розовый', tags: ['vip'] as const },
    { name: 'Елена Ким', phone: '+7 925 444 55 66', notes: '', tags: ['new'] as const },
    { name: 'Дарья Волкова', phone: '+7 903 777 88 99', notes: 'Аллергия на ацетон', tags: [] as const },
    { name: 'Ольга Петрова', phone: '+7 910 222 33 44', notes: '', tags: [] as const },
    { name: 'Ирина Смирнова', phone: '+7 999 555 66 77', notes: '', tags: ['vip'] as const },
    { name: 'Юлия Лебедева', phone: '+7 926 888 99 00', notes: 'Приходит с ребёнком', tags: [] as const },
  ];
  clientsData.forEach((c) =>
    clientStore.addClient({
      name: c.name,
      phone: c.phone,
      notes: c.notes,
      tags: [...c.tags],
    }),
  );
  const storedClients = useClientStore.getState().clients;

  // Appointments — сегодня + ближайшие дни, плюс несколько завершённых для статистики
  const todayKey = toDateKeyOffset(0);

  const apptPlan: Array<{
    clientIdx: number;
    serviceIdx: number;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed';
  }> = [
    // Прямо сейчас — для "Сейчас идёт"
    {
      clientIdx: 0,
      serviceIdx: 1,
      date: todayKey,
      startTime: nowTimeOffset(-15),
      endTime: nowTimeOffset(75),
      status: 'scheduled',
    },
    // Через полтора часа
    {
      clientIdx: 1,
      serviceIdx: 0,
      date: todayKey,
      startTime: nowTimeOffset(90),
      endTime: nowTimeOffset(150),
      status: 'scheduled',
    },
    // Завтра
    {
      clientIdx: 2,
      serviceIdx: 2,
      date: toDateKeyOffset(1),
      startTime: '11:00',
      endTime: '12:15',
      status: 'scheduled',
    },
    {
      clientIdx: 3,
      serviceIdx: 1,
      date: toDateKeyOffset(1),
      startTime: '14:00',
      endTime: '15:30',
      status: 'scheduled',
    },
    // Послезавтра
    {
      clientIdx: 4,
      serviceIdx: 0,
      date: toDateKeyOffset(2),
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
    },
    // Завершённые за последнюю неделю — для финансов
    {
      clientIdx: 0,
      serviceIdx: 1,
      date: toDateKeyOffset(-2),
      startTime: '14:00',
      endTime: '15:30',
      status: 'completed',
    },
    {
      clientIdx: 5,
      serviceIdx: 2,
      date: toDateKeyOffset(-3),
      startTime: '12:00',
      endTime: '13:15',
      status: 'completed',
    },
    {
      clientIdx: 1,
      serviceIdx: 0,
      date: toDateKeyOffset(-5),
      startTime: '11:00',
      endTime: '12:00',
      status: 'completed',
    },
    {
      clientIdx: 2,
      serviceIdx: 3,
      date: toDateKeyOffset(-6),
      startTime: '16:00',
      endTime: '16:45',
      status: 'completed',
    },
    {
      clientIdx: 4,
      serviceIdx: 1,
      date: toDateKeyOffset(-8),
      startTime: '10:00',
      endTime: '11:30',
      status: 'completed',
    },
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
    // Для завершённых — записываем приход в финансы
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
}
