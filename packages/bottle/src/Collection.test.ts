import { describe, expect, it } from '@rstest/core';

import { Collection } from './Collection';
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
      sync: noopSync,
      autoCommit: false,
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
      sync: noopSync,
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
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

  it('folds draft insert updates into one active mutation', async () => {
    const collection = new Collection<TestEntity>();

    const insertMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    const updateMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });

    expect(updateMutation).toBe(insertMutation);
    expect(insertMutation.change).toEqual({
      type: 'insert',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
    });
    expect(insertMutation.status).toBe('draft');

    await updateMutation.commit();

    expect(updateMutation.status).toBe('committed');
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
  });

  it('folds draft updates and deletes into one active mutation per entity', async () => {
    const collection = new Collection<TestEntity>();
    await collection
      .upsert({
        entity: {
          id: 'one',
          name: 'Original',
          meta: { count: 1 },
        },
        sync: noopSync,
        autoCommit: false,
      })
      .commit();

    const firstUpdate = collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    const secondUpdate = collection.upsert({
      entity: {
        id: 'one',
        name: 'Latest',
        meta: { count: 3 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    const deleteMutation = collection.delete({
      id: 'one',
      sync: noopSync,
      autoCommit: false,
    });

    expect(secondUpdate).toBe(firstUpdate);
    expect(deleteMutation).toBe(firstUpdate);
    expect(firstUpdate.change).toEqual({
      type: 'delete',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Latest',
        meta: { count: 3 },
      },
      oldEntity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });

    firstUpdate.rollback();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('preserves pending mutations when an entity receives later updates', async () => {
    const collection = new Collection<TestEntity>();
    await collection
      .upsert({
        entity: {
          id: 'one',
          name: 'Original',
          meta: { count: 1 },
        },
        sync: noopSync,
        autoCommit: false,
      })
      .commit();

    let resolvePending: () => void = () => {};
    const pendingCommit = new Promise<void>(resolve => {
      resolvePending = resolve;
    });

    const pendingMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    const pendingResult = pendingMutation.commit(async () => pendingCommit);

    const laterMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Later',
        meta: { count: 3 },
      },
      sync: noopSync,
      autoCommit: false,
    });

    expect(laterMutation).not.toBe(pendingMutation);
    expect(pendingMutation.status).toBe('pending');
    expect(pendingMutation.change).toEqual({
      type: 'update',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
      oldEntity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
    expect(laterMutation.change).toEqual({
      type: 'update',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Later',
        meta: { count: 3 },
      },
      oldEntity: {
        id: 'one',
        name: 'Pending',
        meta: { count: 2 },
      },
    });

    pendingMutation.rollback();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Later',
      meta: { count: 3 },
    });

    resolvePending();
    await pendingResult;

    expect(pendingMutation.status).toBe('committed');
    expect(laterMutation.status).toBe('draft');
    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Later',
      meta: { count: 3 },
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
      sync: noopSync,
      autoCommit: false,
    });
    collection.delete({
      id: 'one',
      sync: noopSync,
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

  it('returns mutation objects for deleted entities', async () => {
    const collection = new Collection<TestEntity>();
    await collection
      .upsert({
        entity: {
          id: 'one',
          name: 'Original',
          meta: { count: 1 },
        },
        sync: noopSync,
        autoCommit: false,
      })
      .commit();

    const mutation = collection.delete({
      id: 'one',
      sync: noopSync,
      autoCommit: false,
    });

    expect(mutation?.change).toEqual({
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
    expect(mutation?.status).toBe('draft');
    expect(
      collection.delete({
        id: 'missing',
        sync: noopSync,
        autoCommit: false,
      }),
    ).toBeUndefined();
  });

  it('rolls back returned collection mutations before commit', async () => {
    const collection = new Collection<TestEntity>();

    const insertMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    insertMutation.rollback();

    expect(collection.get('one')).toBeUndefined();

    const updateMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    await updateMutation.commit();

    collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    collection
      .upsert({
        entity: {
          id: 'one',
          name: 'Updated',
          meta: { count: 2 },
        },
        sync: noopSync,
        autoCommit: false,
      })
      .rollback();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    collection
      .delete({
        id: 'one',
        sync: noopSync,
        autoCommit: false,
      })
      ?.rollback();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });

    expect(updateMutation.status).toBe('committed');
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
      sync: noopSync,
      autoCommit: false,
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
      sync: noopSync,
      autoCommit: false,
    });
    collection.upsert({
      entity: {
        id: 'two',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
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
      sync: noopSync,
      autoCommit: false,
    });
    const committedMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Stored',
        meta: { count: 1 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    committedMutation.markPending();
    committedMutation.markCommitted();

    const updateMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Optimistic',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });
    const deleteMutation = collection.delete({
      id: 'one',
      sync: noopSync,
      autoCommit: false,
    });

    expect(deleteMutation).toBe(updateMutation);
    expect(collection.get('one')).toBeUndefined();
    expect(updateMutation.change).toEqual({
      type: 'delete',
      id: 'one',
      entity: {
        id: 'one',
        name: 'Optimistic',
        meta: { count: 2 },
      },
      oldEntity: {
        id: 'one',
        name: 'Stored',
        meta: { count: 1 },
      },
    });
    updateMutation.rollback();

    expect(collection.get('one')).toEqual({
      id: 'one',
      name: 'Stored',
      meta: { count: 1 },
    });
  });

  it('tracks mutation status transitions', async () => {
    const collection = new Collection<TestEntity>();

    const insertMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
      sync: noopSync,
      autoCommit: false,
    });

    expect(insertMutation.status).toBe('draft');

    const foldedMutation = collection.upsert({
      entity: {
        id: 'one',
        name: 'Updated',
        meta: { count: 2 },
      },
      sync: noopSync,
      autoCommit: false,
    });

    expect(foldedMutation).toBe(insertMutation);
    expect(insertMutation.status).toBe('draft');

    let thrown: Error | undefined;
    try {
      await insertMutation.commit(async () => {
        throw new Error('save failed');
      });
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('save failed');
    expect(insertMutation.status).toBe('draft');
    expect(insertMutation.error?.message).toBe('save failed');

    insertMutation.markPending();

    expect(insertMutation.status).toBe('pending');

    insertMutation.markCommitted();

    expect(insertMutation.status).toBe('committed');
  });

  it('ingests externally pushed entities without creating a mutation', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

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
    expect(receivedChanges).toEqual([
      {
        type: 'insert',
        id: 'one',
        entity: {
          id: 'one',
          name: 'External',
          meta: { count: 1 },
        },
      },
    ]);
  });

  it('ingests externally pushed updates to existing entities', () => {
    const collection = new Collection<TestEntity>();
    const receivedChanges: ItemChange<TestEntity>[] = [];
    collection.onChange(change => {
      receivedChanges.push(change);
    });

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

  it('auto-commits mutations when autoCommit is true', async () => {
    const collection = new Collection<TestEntity>();
    const entity = {
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    };
    const mutation = collection.upsert({
      entity,
      sync: async () => {},
      autoCommit: true,
    });

    while (mutation.status !== 'committed') {
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    expect(mutation.status).toBe('committed');
    expect(mutation.result).toBeUndefined();
  });

  it('stores auto-commit errors on the mutation', async () => {
    const collection = new Collection<TestEntity>();
    const mutation = collection.upsert({
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

    while (mutation.status !== 'draft' || !mutation.error) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    expect(mutation.error?.message).toBe('sync failed');
    expect(mutation.status).toBe('draft');
  });
});
