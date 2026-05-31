import { describe, expect, it } from '@rstest/core';
import { autorun } from 'mobx';

import { Collection } from './Collection';
import { LocalStorage } from './storage/LocalStorage';
import type { ItemChange } from './types';

type TestEntity = {
  id: string;
  name: string;
  meta: {
    count: number;
  };
};

const noopSync = async (_change: ItemChange<TestEntity>) => {};

describe('Collection', () => {
  it('inserts entities and exposes readonly frozen snapshots', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });

    const entity = collection.get('one');

    expect(entity).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(Object.isFrozen(entity)).toBe(true);
    expect(Object.isFrozen(entity?.meta)).toBe(true);
    expect(collection.all).toEqual([entity]);
    expect(Object.isFrozen(collection.all)).toBe(true);
    expect(receivedChanges).toEqual([
      {
        type: 'insert',
        id: 'one',
        entity: {
          id: 'one',
          name: 'Original',
          meta: { count: 1 },
        },
      },
    ]);
  });

  it('updates existing entities and reports the previous snapshot', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
    });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(receivedChanges[1]).toEqual({
      type: 'update',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      oldEntity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
  });

  it('no-ops when upserting an identical existing entity', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(receivedChanges.length).toBe(1);
    expect(collection.snapshot('one').isDraft).toBe(false);
  });

  it('no-ops when updating with identical values', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.update({
      id: 'one',
      patch: { name: 'Original' },
    });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(receivedChanges.length).toBe(1);
    expect(collection.snapshot('one').isDraft).toBe(false);
  });

  it('folds draft insert updates into one active mutation', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    let snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(true);

    await collection.commit({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(collection.snapshot('one')).toEqual({
      original: undefined,
      current: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      isDraft: false,
    });
  });

  it('folds draft updates and deletes into one active mutation per entity', async () => {
    const collection = new Collection<TestEntity>();
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Latest',
        meta: { count: 3 },
      },
      autoCommit: false,
    });
    collection.delete({
      id: 'one',
      autoCommit: false,
    });

    const snap = collection.snapshot('one');
    expect(snap.original).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(snap.current).toBeUndefined();
    expect(snap.isDraft).toBe(true);

    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('rolls back a draft update when folded back to the original entity', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Changed',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    let snap = collection.snapshot('one');
    expect(snap.isDraft).toBe(true);
    expect(snap.original).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    snap = collection.snapshot('one');
    expect(snap.isDraft).toBe(false);
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('preserves pending mutations when an entity receives later updates', async () => {
    const collection = new Collection<TestEntity>();
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    let resolvePending: () => void = () => {};
    const pendingCommit = new Promise<void>(resolve => {
      resolvePending = resolve;
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
      autoCommit: false,
    });
    const pendingResult = collection.commit({
      id: 'one',
      sync: async () => pendingCommit,
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Later',
        meta: { count: 3 },
      },
      autoCommit: false,
    });

    const snap = collection.snapshot('one');
    expect(snap.original).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Later',
      meta: { count: 3 },
    });
    expect(snap.isDraft).toBe(true);

    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });

    resolvePending();
    await pendingResult;

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });
  });

  it('deletes existing entities and notifies listeners with the removed snapshot', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.delete({
      id: 'one',
      autoCommit: false,
    });

    expect(collection.get('one')).toBeUndefined();
    expect(collection.all).toEqual([]);
    expect(receivedChanges[1]).toEqual({
      type: 'delete',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      oldEntity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
  });

  it('no-ops when deleting a missing entity', () => {
    const collection = new Collection<TestEntity>();

    collection.delete({
      id: 'missing',
      autoCommit: false,
    });

    expect(collection.get('missing')).toBeUndefined();
    expect(collection.all).toEqual([]);
  });

  it('rolls back collection mutations before commit', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toBeUndefined();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });
    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    collection.delete({
      id: 'one',
      autoCommit: false,
    });
    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('does not notify unsubscribed change handlers', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    const unsubscribe = collection.onChange(change => {
      receivedChanges.push(change);
    });

    unsubscribe();
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });

    expect(receivedChanges).toEqual([]);
  });

  it('returns frozen readonly snapshots from collection read APIs', () => {
    const collection = new Collection<TestEntity>();
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.upsert({
      entity: {
        id: 'two',
        name: 'Updated',
        meta: { count: 2 },
      },
    });

    const all = collection.all;
    const found = collection.find(entity => entity.meta.count === 2);
    const filtered = collection.filter(entity => entity.meta.count > 1);

    expect(Object.isFrozen(all)).toBe(true);
    expect(Object.isFrozen(all[0])).toBe(true);
    expect(Object.isFrozen(all[0]?.meta)).toBe(true);
    expect(found).toEqual({
      id: 'two',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(Object.isFrozen(found)).toBe(true);
    expect(Object.isFrozen(found?.meta)).toBe(true);
    expect(filtered).toEqual([found]);
    expect(Object.isFrozen(filtered)).toBe(true);
    expect(Object.isFrozen(filtered[0])).toBe(true);
    expect(Object.isFrozen(filtered[0]?.meta)).toBe(true);
  });

  it('diffs folded optimistic changes against ground truth', () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Stored',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    collection.commit({ id: 'one', sync: noopSync });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Optimistic',
        meta: { count: 2 },
      },
      autoCommit: false,
    });
    collection.delete({
      id: 'one',
      autoCommit: false,
    });

    const snap = collection.snapshot('one');
    expect(snap.current).toBeUndefined();
    expect(snap.original).toEqual({
      id: 'one',
      name: 'Stored',
      meta: { count: 1 },
    });
    expect(snap.isDraft).toBe(true);

    collection.rollback({ id: 'one' });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Stored',
      meta: { count: 1 },
    });
  });

  it('throws when committing or rolling back without an active mutation', () => {
    const collection = new Collection<TestEntity>();

    expect(() => {
      collection.commit({ id: 'one' });
    }).toThrow("No active mutation for entity 'one'");

    expect(() => {
      collection.rollback({ id: 'one' });
    }).toThrow("No active mutation for entity 'one'");
  });

  it('commits and removes mutation on failure', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    let thrown: Error | undefined;
    try {
      await collection.commit({
        id: 'one',
        sync: async () => {
          throw new Error('save failed');
        },
      });
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('save failed');
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    expect(() => {
      collection.commit({ id: 'one' });
    }).toThrow("No active mutation for entity 'one'");
  });

  it('ingests externally pushed entities without creating a mutation', () => {
    const collection = new Collection<TestEntity>();

    const result = collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 1 },
      },
    });

    expect(result).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 1 },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 1 },
    });
  });

  it('ingests externally pushed updates to existing entities', () => {
    const collection = new Collection<TestEntity>();

    collection.ingest({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    collection.ingest({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
    });

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
  });

  it('updates snapshot original when ingesting during an active mutation', () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    let snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(true);

    collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 3 },
      },
    });

    snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
    expect(snap.isDraft).toBe(false);
  });

  it('discards a pending insert mutation when the entity is ingested', async () => {
    const collection = new Collection<TestEntity>();

    const syncPromise = new Promise<void>(() => {});
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 1 },
      },
      sync: async () => {
        await syncPromise;
      },
    });

    let snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 1 },
    });
    expect(snap.isDraft).toBe(false);

    collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 2 },
      },
    });

    snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(false);
  });

  it('updates original snapshot when ingesting during a draft update mutation', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: noopSync,
    });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    let snap = collection.snapshot('one');
    expect(snap.original).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(true);

    collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 3 },
      },
    });

    snap = collection.snapshot('one');
    expect(snap.original).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Pending',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(true);
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
  });

  it('removes externally deleted entities without creating a mutation', () => {
    const collection = new Collection<TestEntity>();

    collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 1 },
      },
    });

    const result = collection.remove({ id: 'one' });

    expect(result).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 1 },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(collection.get('one')).toBeUndefined();
  });

  it('returns undefined when removing a non-existent entity', () => {
    const collection = new Collection<TestEntity>();

    const result = collection.remove({ id: 'one' });

    expect(result).toBeUndefined();
  });

  it('removes an active mutation when the entity is removed', () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    let snap = collection.snapshot('one');
    expect(snap.isDraft).toBe(true);

    collection.remove({ id: 'one' });

    snap = collection.snapshot('one');
    expect(snap.current).toBeUndefined();
    expect(snap.isDraft).toBe(false);
    expect(collection.get('one')).toBeUndefined();
  });

  it('does not emit changes when removing an entity', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

    collection.ingest({
      entity: {
        id: 'one',
        name: 'External',
        meta: { count: 1 },
      },
    });
    receivedChanges.length = 0;

    collection.remove({ id: 'one' });

    expect(receivedChanges).toEqual([]);
  });

  it('auto-commits mutations when autoCommit is true', async () => {
    const collection = new Collection<TestEntity>();
    const entity = {
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    };
    collection.upsert({
      entity,
      sync: async () => {},
      autoCommit: true,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(collection.get('one')).toEqual(entity);
    expect(collection.snapshot('one')).toEqual({
      original: undefined,
      current: entity,
      isDraft: false,
    });
  });

  it('stores auto-commit errors and removes mutation on failure', async () => {
    const collection = new Collection<TestEntity>();
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: async () => {
        throw new Error('sync failed');
      },
      autoCommit: true,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    expect(() => {
      collection.commit({
        id: 'one',
        sync: async () => {},
      });
    }).toThrow("No active mutation for entity 'one'");
  });

  it('calls onError when auto-commit fails', async () => {
    const collection = new Collection<TestEntity>();
    let receivedError: Error | undefined;

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: async () => {
        throw new Error('sync failed');
      },
      onError: (error: Error) => {
        receivedError = error;
      },
      autoCommit: true,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(receivedError?.message).toBe('sync failed');
  });

  it('clears snapshots when an update mutation settles on commit', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    await collection.commit({ id: 'one', sync: noopSync });

    const snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(false);
  });

  it('clears snapshots when a mutation settles on rollback', () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    collection.rollback({ id: 'one' });

    const snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toBeUndefined();
    expect(snap.isDraft).toBe(false);
  });

  it('clears snapshots when a mutation settles on commit failure', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      autoCommit: false,
    });

    try {
      await collection.commit({
        id: 'one',
        sync: async () => {
          throw new Error('sync failed');
        },
      });
    } catch {
      // expected
    }

    const snap = collection.snapshot('one');
    expect(snap.original).toBeUndefined();
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(false);
  });

  it('reactively notifies observers when snapshot draft status changes', async () => {
    const collection = new Collection<TestEntity>();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      autoCommit: false,
    });

    const snaps: { isDraft: boolean; original: unknown; current: unknown }[] =
      [];
    const stop = autorun(() => {
      const snap = collection.snapshot('one');
      snaps.push({
        isDraft: snap.isDraft,
        original: snap.original,
        current: snap.current,
      });
    });

    expect(snaps.length).toBe(1);
    expect(snaps.at(0)?.isDraft).toBe(true);

    await collection.commit({ id: 'one', sync: noopSync });

    expect(snaps.length).toBe(3);
    expect(snaps.at(1)?.isDraft).toBe(false);
    expect(snaps.at(2)?.isDraft).toBe(false);

    stop();
  });

  it('hydrates entities from storage on load', async () => {
    const storage = new LocalStorage<TestEntity>();
    await storage.setEntity({ id: 'one', name: 'Stored', meta: { count: 1 } });
    await storage.setEntity({ id: 'two', name: 'Also', meta: { count: 2 } });

    const collection = new Collection<TestEntity>({ storage });
    await collection.load();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Stored',
      meta: { count: 1 },
    });
    expect(collection.get('two')).toEqual({
      id: 'two',
      name: 'Also',
      meta: { count: 2 },
    });
  });

  it('hydrates draft mutations and snapshots from storage', async () => {
    const storage = new LocalStorage<TestEntity>();

    const change: ItemChange<TestEntity> = {
      type: 'update',
      id: 'one',
      entity: { id: 'one', name: 'Updated', meta: { count: 2 } },
      oldEntity: { id: 'one', name: 'Original', meta: { count: 1 } },
    };

    await storage.setEntity({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
    await storage.setMutation({
      id: 'mut-1',
      change,
      status: 'draft',
    });
    await storage.setSnapshot({
      id: 'one',
      original: { id: 'one', name: 'External', meta: { count: 3 } },
      current: { id: 'one', name: 'Updated', meta: { count: 2 } },
      mutationId: 'mut-1',
    });

    const collection = new Collection<TestEntity>({ storage });
    await collection.load();

    const snap = collection.snapshot('one');
    expect(snap.original).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
    expect(snap.current).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
    expect(snap.isDraft).toBe(true);
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });

    const stored = await storage.getAll();
    expect(stored.mutations.length).toBe(1);
    expect(stored.mutations[0]?.id).toBe('mut-1');
  });

  it('does not duplicate stored mutations on repeated load', async () => {
    const storage = new LocalStorage<TestEntity>();

    await storage.setEntity({
      id: 'one',
      name: 'External',
      meta: { count: 3 },
    });
    await storage.setMutation({
      id: 'mut-1',
      change: {
        type: 'update',
        id: 'one',
        entity: { id: 'one', name: 'Updated', meta: { count: 2 } },
        oldEntity: { id: 'one', name: 'External', meta: { count: 3 } },
      },
      status: 'draft',
    });
    await storage.setSnapshot({
      id: 'one',
      original: { id: 'one', name: 'External', meta: { count: 3 } },
      current: { id: 'one', name: 'Updated', meta: { count: 2 } },
      mutationId: 'mut-1',
    });

    const collection = new Collection<TestEntity>({ storage });
    await collection.load();
    await collection.load();
    await collection.load();

    const stored = await storage.getAll();
    expect(stored.mutations.length).toBe(1);
    expect(stored.mutations[0]?.id).toBe('mut-1');
    expect(stored.snapshots.length).toBe(1);
    expect(stored.snapshots[0]?.id).toBe('one');
  });

  it('syncs upserts to storage', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });

    const stored = await storage.getAll();
    expect(stored.entities).toEqual([
      { id: 'one', name: 'Original', meta: { count: 1 } },
    ]);
  });

  it('syncs deletes to storage', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });
    collection.delete({ id: 'one', autoCommit: false });

    const stored = await storage.getAll();
    expect(stored.entities).toEqual([]);
  });

  it('syncs ingest to storage', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.ingest({
      entity: { id: 'one', name: 'External', meta: { count: 1 } },
    });

    const stored = await storage.getAll();
    expect(stored.entities).toEqual([
      { id: 'one', name: 'External', meta: { count: 1 } },
    ]);
  });

  it('syncs remove to storage', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.ingest({
      entity: { id: 'one', name: 'External', meta: { count: 1 } },
    });
    collection.remove({ id: 'one' });

    const stored = await storage.getAll();
    expect(stored.entities).toEqual([]);
  });

  it('syncs mutations and snapshots to storage', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });

    const stored = await storage.getAll();
    expect(stored.mutations.length).toBe(1);
    expect(stored.mutations[0]?.status).toBe('draft');
    expect(stored.snapshots.length).toBe(1);
    expect(stored.snapshots[0]?.id).toBe('one');
  });

  it('removes mutation and snapshot from storage on commit', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });
    await collection.commit({ id: 'one', sync: noopSync });

    const stored = await storage.getAll();
    expect(stored.mutations).toEqual([]);
    expect(stored.snapshots).toEqual([]);
  });

  it('removes mutation and snapshot from storage on rollback', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });
    collection.rollback({ id: 'one' });

    const stored = await storage.getAll();
    expect(stored.mutations).toEqual([]);
    expect(stored.snapshots).toEqual([]);
  });

  it('removes mutation and snapshot from storage on commit failure', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      autoCommit: false,
    });

    try {
      await collection.commit({
        id: 'one',
        sync: async () => {
          throw new Error('sync failed');
        },
      });
    } catch {
      // expected
    }

    const stored = await storage.getAll();
    expect(stored.mutations).toEqual([]);
    expect(stored.snapshots).toEqual([]);
  });

  it('updates stored mutation on fold', async () => {
    const storage = new LocalStorage<TestEntity>();
    const collection = new Collection<TestEntity>({ storage });

    collection.upsert({
      entity: { id: 'one', name: 'A', meta: { count: 1 } },
      autoCommit: false,
    });
    collection.upsert({
      entity: { id: 'one', name: 'B', meta: { count: 2 } },
      autoCommit: false,
    });

    const stored = await storage.getAll();
    expect(stored.mutations.length).toBe(1);
    expect(stored.mutations[0]?.change.entity).toEqual({
      id: 'one',
      name: 'B',
      meta: { count: 2 },
    });
    expect(stored.snapshots[0]?.current).toEqual({
      id: 'one',
      name: 'B',
      meta: { count: 2 },
    });
  });

  it('restores a clean collection when load is called with no storage', async () => {
    const collection = new Collection<TestEntity>();
    collection.upsert({
      entity: { id: 'one', name: 'Original', meta: { count: 1 } },
    });

    await collection.load();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('replaces in-memory state when load is called after mutations', async () => {
    const storage = new LocalStorage<TestEntity>();
    await storage.setEntity({ id: 'one', name: 'Old', meta: { count: 1 } });

    const collection = new Collection<TestEntity>({ storage });
    await collection.load();
    collection.upsert({
      entity: { id: 'two', name: 'New', meta: { count: 2 } },
      autoCommit: false,
    });

    await collection.load();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Old',
      meta: { count: 1 },
    });
    expect(collection.get('two')).toEqual({
      id: 'two',
      name: 'New',
      meta: { count: 2 },
    });
  });
});
