import {
  PACK_REGISTRY,
  PACK_BY_SLUG,
  resolvePack,
  tProf,
  DEFAULT_PACK_SLUG,
} from '../professionPacks';

describe('PACK_REGISTRY', () => {
  it('contains at least the 3 v1 packs', () => {
    const slugs = PACK_REGISTRY.map((p) => p.slug);
    expect(slugs).toContain('manicure');
    expect(slugs).toContain('tutor');
    expect(slugs).toContain('photographer');
  });

  it('every pack has required fields', () => {
    for (const p of PACK_REGISTRY) {
      expect(p.slug).toBeTruthy();
      expect(p.version).toBeTruthy();
      expect(p.name.ru).toBeTruthy();
      expect(p.defaultServices.length).toBeGreaterThan(0);
      expect(p.emptyStates).toBeTruthy();
      expect(p.reminderTemplate).toBeTruthy();
    }
  });

  it('slugs are unique', () => {
    const slugs = PACK_REGISTRY.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('PACK_BY_SLUG is consistent with registry', () => {
    for (const p of PACK_REGISTRY) {
      expect(PACK_BY_SLUG[p.slug]).toBe(p);
    }
  });
});

describe('resolvePack', () => {
  it('returns default pack when specializationId is null', () => {
    const p = resolvePack(null);
    expect(p.slug).toBe(DEFAULT_PACK_SLUG);
  });
  it('returns default pack when undefined', () => {
    const p = resolvePack(undefined);
    expect(p.slug).toBe(DEFAULT_PACK_SLUG);
  });
  it('returns default pack when unknown id', () => {
    const p = resolvePack('xxxxxxxxxxxxx-not-real');
    expect(p.slug).toBe(DEFAULT_PACK_SLUG);
  });
  it('maps legacy id "nails" to manicure pack', () => {
    expect(resolvePack('nails').slug).toBe('manicure');
  });
  it('maps "tutor" / "tutoring" both to tutor pack', () => {
    expect(resolvePack('tutor').slug).toBe('tutor');
    expect(resolvePack('tutoring').slug).toBe('tutor');
  });
  it('maps "photographer" / "videographer" both to photographer pack', () => {
    expect(resolvePack('photographer').slug).toBe('photographer');
    expect(resolvePack('videographer').slug).toBe('photographer');
  });
  it('returns pack when slug matches directly', () => {
    expect(resolvePack('manicure').slug).toBe('manicure');
  });
});

describe('tProf', () => {
  const manicure = PACK_BY_SLUG['manicure'];
  const tutor = PACK_BY_SLUG['tutor'];

  it('returns vocabulary value when key exists', () => {
    expect(tProf(manicure, 'client.singular', 'fallback')).toBe('клиент');
    expect(tProf(tutor, 'client.singular', 'fallback')).toBe('ученик');
  });

  it('returns fallback when key absent', () => {
    // Создадим маленький pack без некоторых ключей, проверим fallback
    const stub = { ...manicure, vocabulary: {} };
    expect(tProf(stub, 'client.singular', 'клиент-fallback')).toBe('клиент-fallback');
  });

  it('substitutes {placeholder} from vars', () => {
    const stub = {
      ...manicure,
      vocabulary: { 'client.singular': 'Привет, {name}!' },
    };
    expect(tProf(stub, 'client.singular', 'fb', { name: 'Анна' })).toBe('Привет, Анна!');
  });

  it('leaves placeholder intact if var not provided', () => {
    const stub = {
      ...manicure,
      vocabulary: { 'client.singular': 'Привет, {name}!' },
    };
    expect(tProf(stub, 'client.singular', 'fb', {})).toBe('Привет, {name}!');
  });

  it('handles multiple placeholders + number values', () => {
    const stub = {
      ...manicure,
      vocabulary: { 'client.singular': '{name} — {days} дней' },
    };
    expect(tProf(stub, 'client.singular', 'fb', { name: 'A', days: 42 })).toBe('A — 42 дней');
  });
});

describe('Pack content sanity', () => {
  it('tutor uses "ученик" terminology consistently', () => {
    const tutor = PACK_BY_SLUG['tutor'];
    expect(tutor.vocabulary['client.singular']).toBe('ученик');
    expect(tutor.vocabulary['appointment.singular']).toBe('занятие');
    expect(tutor.emptyStates.clients?.title).toContain('ученик');
  });

  it('photographer uses "съёмка" terminology', () => {
    const ph = PACK_BY_SLUG['photographer'];
    expect(ph.vocabulary['appointment.singular']).toBe('съёмка');
    expect(ph.emptyStates.today?.subtitle).toContain('съёмк');
  });

  it('reminder templates contain {client} placeholder', () => {
    for (const p of PACK_REGISTRY) {
      expect(p.reminderTemplate.beforeAppointment).toContain('{client}');
      expect(p.reminderTemplate.sleeping).toContain('{client}');
    }
  });

  it('default services have positive price and duration', () => {
    for (const p of PACK_REGISTRY) {
      for (const s of p.defaultServices) {
        expect(s.price).toBeGreaterThan(0);
        expect(s.duration).toBeGreaterThan(0);
      }
    }
  });
});
