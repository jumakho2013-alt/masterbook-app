/**
 * Приватность телеметрии.
 *
 * В приложении лежат персональные данные ТРЕТЬИХ ЛИЦ — клиентов мастера: имена,
 * телефоны, заметки, суммы. Согласия на передачу их в сторонний сервис никто не
 * давал. Утечка сюда не падает и не видна в логах — единственная защита в том,
 * что событие собирается по БЕЛОМУ списку полей. Тесты держат этот список.
 */

import { очиститьСобытие, captureException, captureMessage,
         setUserContext, clearUserContext, initCrashReporter } from '@/src/lib/crashReporter';

describe('очистка события перед отправкой', () => {
  it('выбрасывает всё, чего нет в белом списке', () => {
    const результат = очиститьСобытие({
      exception: { values: [{ type: 'Error' }] },
      level: 'error',
      // Ниже — то, что Sentry добавляет сам и что может нести данные клиентов
      request: { data: { name: 'Анна Петрова', phone: '+992900112233' } },
      breadcrumbs: [{ message: 'Клиент: Анна, долг 500' }],
      message: 'сырое сообщение пользователя',
      server_name: 'iPhone Анны',
    });
    expect(результат.exception).toBeDefined();
    expect(результат.level).toBe('error');
    expect(результат.request).toBeUndefined();
    expect(результат.breadcrumbs).toBeUndefined();
    expect(результат.message).toBeUndefined();
    expect(результат.server_name).toBeUndefined();
  });

  it('от пользователя оставляет только id — ни email, ни телефона, ни ip', () => {
    const результат = очиститьСобытие({
      user: {
        id: 'd254ba40-5b39-452c-a9a4-81c5f50d6b0d',
        email: 'master@example.com',
        ip_address: '95.85.100.1',
        username: 'Мастер Аня',
      },
    });
    expect(результат.user).toEqual({ id: 'd254ba40-5b39-452c-a9a4-81c5f50d6b0d' });
  });

  it('без id пользователя не отправляет объект user вовсе', () => {
    const результат = очиститьСобытие({ user: { email: 'master@example.com' } });
    expect(результат.user).toBeUndefined();
  });

  it('в сериализованном событии не остаётся ни одной персональной строки', () => {
    const сырое = {
      exception: { values: [{ type: 'TypeError', value: 'undefined is not an object' }] },
      user: { id: 'u-1', email: 'master@example.com' },
      request: { data: { clientName: 'Анна Петрова', notes: 'аллергия на гель' } },
      breadcrumbs: [{ data: { phone: '+992900112233' } }],
      contexts: { device: { model: 'iPhone' } },
    };
    const текст = JSON.stringify(очиститьСобытие(сырое));
    for (const секрет of ['Анна Петрова', 'аллергия', '+992900112233', 'master@example.com']) {
      expect(текст).not.toContain(секрет);
    }
    // техническая часть при этом сохранилась
    expect(текст).toContain('TypeError');
    expect(текст).toContain('iPhone');
  });
});

describe('поведение без DSN', () => {
  it('вызовы безопасны и ничего не делают', () => {
    // DSN не задан → Sentry не грузится вовсе. Ни один вызов не должен бросить.
    expect(() => initCrashReporter()).not.toThrow();
    expect(() => captureException(new Error('тест'), { tag: 'проверка' })).not.toThrow();
    expect(() => captureMessage('тест', 'info')).not.toThrow();
    expect(() => setUserContext('u-1')).not.toThrow();
    expect(() => clearUserContext()).not.toThrow();
  });
});
