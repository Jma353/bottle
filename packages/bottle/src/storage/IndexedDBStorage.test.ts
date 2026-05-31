import 'fake-indexeddb/auto';

import { describe, expect, it } from '@rstest/core';

import { IndexedDBStorage } from './IndexedDBStorage';

type TestEntity = {
  id: string;
  name: string;
};

describe('IndexedDBStorage', () => {
  it('returns empty state by default', async () => {
    const storage = new IndexedDBStorage<TestEntity>({ dbName: 'test-empty' });
    const result = await storage.getAll();

    expect(result.entities).toEqual([]);
    expect(result.snapshots).toEqual([]);
    expect(result.mutations).toEqual([]);
  });

  it('stores and retrieves entities', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-entities',
    });
    await storage.setEntity({ id: 'one', name: 'A' });
    await storage.setEntity({ id: 'two', name: 'B' });

    const result = await storage.getAll();
    expect(result.entities).toEqual([
      { id: 'one', name: 'A' },
      { id: 'two', name: 'B' },
    ]);
  });

  it('deletes an entity', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-delete-entity',
    });
    await storage.setEntity({ id: 'one', name: 'A' });
    await storage.deleteEntity('one');

    const result = await storage.getAll();
    expect(result.entities).toEqual([]);
  });

  it('stores and retrieves snapshots', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-snapshots',
    });
    await storage.setSnapshot({
      id: 'one',
      original: undefined,
      current: { id: 'one', name: 'A' },
      mutationId: 'mut-1',
    });

    const result = await storage.getAll();
    expect(result.snapshots).toEqual([
      {
        id: 'one',
        original: undefined,
        current: { id: 'one', name: 'A' },
        mutationId: 'mut-1',
      },
    ]);
  });

  it('deletes a snapshot', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-delete-snapshot',
    });
    await storage.setSnapshot({
      id: 'one',
      original: undefined,
      current: { id: 'one', name: 'A' },
      mutationId: 'mut-1',
    });
    await storage.deleteSnapshot('one');

    const result = await storage.getAll();
    expect(result.snapshots).toEqual([]);
  });

  it('stores and retrieves mutations', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-mutations',
    });
    await storage.setMutation({
      id: 'mut-1',
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'A' },
      },
      status: 'draft',
    });

    const result = await storage.getAll();
    expect(result.mutations).toEqual([
      {
        id: 'mut-1',
        change: {
          type: 'create',
          id: 'one',
          entity: { id: 'one', name: 'A' },
        },
        status: 'draft',
      },
    ]);
  });

  it('deletes a mutation', async () => {
    const storage = new IndexedDBStorage<TestEntity>({
      dbName: 'test-delete-mutation',
    });
    await storage.setMutation({
      id: 'mut-1',
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'A' },
      },
      status: 'draft',
    });
    await storage.deleteMutation('mut-1');

    const result = await storage.getAll();
    expect(result.mutations).toEqual([]);
  });

  it('clears all data', async () => {
    const storage = new IndexedDBStorage<TestEntity>({ dbName: 'test-clear' });
    await storage.setEntity({ id: 'one', name: 'A' });
    await storage.setSnapshot({
      id: 'one',
      original: undefined,
      current: { id: 'one', name: 'A' },
      mutationId: 'mut-1',
    });
    await storage.setMutation({
      id: 'mut-1',
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'A' },
      },
      status: 'draft',
    });
    await storage.clear();

    const result = await storage.getAll();
    expect(result.entities).toEqual([]);
    expect(result.snapshots).toEqual([]);
    expect(result.mutations).toEqual([]);
  });

  it('isolates data by dbName', async () => {
    const storageA = new IndexedDBStorage<TestEntity>({ dbName: 'a' });
    const storageB = new IndexedDBStorage<TestEntity>({ dbName: 'b' });

    await storageA.setEntity({ id: 'one', name: 'A' });
    await storageB.setEntity({ id: 'one', name: 'B' });

    const resultA = await storageA.getAll();
    const resultB = await storageB.getAll();

    expect(resultA.entities).toEqual([{ id: 'one', name: 'A' }]);
    expect(resultB.entities).toEqual([{ id: 'one', name: 'B' }]);
  });
});
