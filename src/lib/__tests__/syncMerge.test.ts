import { mergeRemote, type RemoteChange } from '../syncMerge';

interface Row {
  id: string;
  name: string;
  updatedAt?: string;
}

const live = (id: string, name: string, updatedAt: string): RemoteChange<Row> => ({
  id,
  updatedAt,
  deletedAt: null,
  record: { id, name, updatedAt },
});
const dead = (id: string, deletedAt: string): RemoteChange<Row> => ({
  id,
  updatedAt: deletedAt,
  deletedAt,
  record: null,
});

const T0 = '2026-06-01T10:00:00.000Z';
const T1 = '2026-06-02T10:00:00.000Z';
const T2 = '2026-06-03T10:00:00.000Z';

describe('mergeRemote (last-write-wins)', () => {
  it('inserts a brand-new remote record', () => {
    const { records } = mergeRemote<Row>([], [live('a', 'Анна', T1)]);
    expect(records).toEqual([{ id: 'a', name: 'Анна', updatedAt: T1 }]);
  });

  it('remote newer than local → overwrites', () => {
    const local = [{ id: 'a', name: 'old', updatedAt: T0 }];
    const { records } = mergeRemote(local, [live('a', 'new', T1)]);
    expect(records[0].name).toBe('new');
  });

  it('local newer than remote → keeps local (will re-push)', () => {
    const local = [{ id: 'a', name: 'local-edit', updatedAt: T2 }];
    const { records } = mergeRemote(local, [live('a', 'stale-remote', T1)]);
    expect(records[0].name).toBe('local-edit');
  });

  it('remote delete newer than local edit → removes local', () => {
    const local = [{ id: 'a', name: 'x', updatedAt: T0 }];
    const { records, appliedDeletes } = mergeRemote(local, [dead('a', T1)]);
    expect(records).toHaveLength(0);
    expect(appliedDeletes).toEqual(['a']);
  });

  it('remote delete OLDER than local edit → keeps local (edit wins over old delete)', () => {
    const local = [{ id: 'a', name: 'resurrected', updatedAt: T2 }];
    const { records, appliedDeletes } = mergeRemote(local, [dead('a', T1)]);
    expect(records).toHaveLength(1);
    expect(appliedDeletes).toEqual([]);
  });

  it('tombstone for a record we never had → no-op', () => {
    const { records, appliedDeletes } = mergeRemote<Row>([], [dead('ghost', T1)]);
    expect(records).toHaveLength(0);
    expect(appliedDeletes).toEqual([]);
  });

  it('local record with no updatedAt is always overwritten by any remote (treated as oldest)', () => {
    const local = [{ id: 'a', name: 'no-ts' }];
    const { records } = mergeRemote(local, [live('a', 'remote', T0)]);
    expect(records[0].name).toBe('remote');
  });

  it('does not touch local records absent from the remote set', () => {
    const local = [
      { id: 'a', name: 'keep', updatedAt: T1 },
      { id: 'b', name: 'also-keep', updatedAt: T1 },
    ];
    const { records } = mergeRemote(local, [live('a', 'updated', T2)]);
    expect(records.find((r) => r.id === 'b')?.name).toBe('also-keep');
    expect(records.find((r) => r.id === 'a')?.name).toBe('updated');
  });
});
