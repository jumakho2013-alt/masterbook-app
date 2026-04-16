import {
  appointmentSchema,
  clientSchema,
  serviceSchema,
  signInSchema,
  signUpSchema,
  timeString,
  dateKey,
} from '../validation';

describe('time & date primitives', () => {
  test.each([
    ['00:00', true],
    ['09:30', true],
    ['23:59', true],
    ['24:00', false],
    ['9:30', false],
    ['25:00', false],
    ['12:60', false],
    ['', false],
  ])('timeString(%p) → valid=%p', (input, ok) => {
    expect(timeString.safeParse(input).success).toBe(ok);
  });

  test.each([
    ['2025-01-15', true],
    ['2099-12-31', true],
    ['15-01-2025', false],
    ['2025/01/15', false],
    ['2025-1-1', false],
    ['', false],
  ])('dateKey(%p) → valid=%p', (input, ok) => {
    expect(dateKey.safeParse(input).success).toBe(ok);
  });
});

describe('appointmentSchema', () => {
  const base = {
    clientId: 'c1',
    serviceId: 's1',
    date: '2025-04-16',
    startTime: '10:00',
    endTime: '11:00',
    price: 2500,
  };

  it('accepts a valid appointment', () => {
    expect(appointmentSchema.safeParse(base).success).toBe(true);
  });

  it('rejects end time <= start time', () => {
    const r = appointmentSchema.safeParse({ ...base, endTime: '10:00' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.errors[0].path).toContain('endTime');
    }
  });

  it('rejects negative price', () => {
    expect(appointmentSchema.safeParse({ ...base, price: -100 }).success).toBe(false);
  });

  it('rejects missing clientId', () => {
    expect(appointmentSchema.safeParse({ ...base, clientId: '' }).success).toBe(false);
  });

  it('allows notes up to 500 chars, rejects beyond', () => {
    expect(appointmentSchema.safeParse({ ...base, notes: 'x'.repeat(500) }).success).toBe(true);
    expect(appointmentSchema.safeParse({ ...base, notes: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('clientSchema', () => {
  it('requires a name', () => {
    expect(clientSchema.safeParse({ name: '', phone: '+79161234567' }).success).toBe(false);
  });

  it('accepts empty phone (optional) and normalises notes default', () => {
    const r = clientSchema.safeParse({ name: 'Анна', phone: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe('');
  });

  it('rejects bogus phone', () => {
    expect(clientSchema.safeParse({ name: 'Анна', phone: 'abc' }).success).toBe(false);
  });

  it('accepts +7 / +1 style phones', () => {
    expect(clientSchema.safeParse({ name: 'Анна', phone: '+7 916 123 45 67' }).success).toBe(true);
    expect(clientSchema.safeParse({ name: 'Анна', phone: '+1 (415) 555-0123' }).success).toBe(true);
  });
});

describe('serviceSchema', () => {
  const ok = { name: 'Маникюр', price: 2500, duration: 60 };
  it('accepts valid service', () => {
    expect(serviceSchema.safeParse(ok).success).toBe(true);
  });
  it('rejects duration < 5 or > 24h', () => {
    expect(serviceSchema.safeParse({ ...ok, duration: 4 }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...ok, duration: 24 * 60 + 1 }).success).toBe(false);
  });
  it('rejects non-integer duration', () => {
    expect(serviceSchema.safeParse({ ...ok, duration: 60.5 }).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('signInSchema lowercases email', () => {
    const r = signInSchema.safeParse({ email: 'Foo@Example.COM', password: 'secret1' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('foo@example.com');
  });

  it('rejects short password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: '123' }).success).toBe(false);
  });

  it('signUpSchema requires name', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.co', password: 'secret1', name: '' }).success,
    ).toBe(false);
  });
});
