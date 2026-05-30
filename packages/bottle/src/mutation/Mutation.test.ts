import { describe, expect, it } from '@rstest/core';

import { Collection } from '../Collection';
import type { ItemChange } from '../types';

type TestEntity = {
  id: string;
  name: string;
};

const noopSync = async (_change: ItemChange<TestEntity>) => {};

describe('Mutation', () => {
  it('records executor errors and returns to draft', async () => {
    const collection = new Collection<TestEntity>('tests');
    const mutation = collection.upsert({
      entity: { id: 'one', name: 'Original' },
      sync: noopSync,
      autoCommit: false,
    });

    let thrown: Error | undefined;
    try {
      await mutation.commit(async () => {
        throw new Error('save failed');
      });
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('save failed');
    expect(mutation.status).toBe('draft');
    expect(mutation.error?.message).toBe('save failed');

    await mutation.commit();

    expect(mutation.status).toBe('committed');
  });

  it('rolls back collection changes before commit and rejects later commits', async () => {
    const collection = new Collection<TestEntity>('tests');
    const mutation = collection.upsert({
      entity: { id: 'one', name: 'Original' },
      sync: noopSync,
      autoCommit: false,
    });

    mutation.rollback();
    mutation.rollback();

    expect(collection.get('one')).toBeUndefined();

    let thrown: Error | undefined;
    try {
      await mutation.commit();
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('Cannot commit a rolled-back mutation');
  });

  it('rejects rollback after commit', async () => {
    const collection = new Collection<TestEntity>('tests');
    const mutation = collection.upsert({
      entity: { id: 'one', name: 'Original' },
      sync: noopSync,
      autoCommit: false,
    });

    await mutation.commit();

    expect(() => {
      mutation.rollback();
    }).toThrow('Cannot rollback a committed mutation');
    expect(collection.get('one')).toEqual({ id: 'one', name: 'Original' });
  });

  it('can be marked pending and committed without a transport executor', () => {
    const collection = new Collection<TestEntity>('tests');
    const mutation = collection.upsert({
      entity: { id: 'one', name: 'Original' },
      sync: noopSync,
      autoCommit: false,
    });

    mutation.markPending();

    expect(mutation.status).toBe('pending');
    expect(collection.get('one')).toEqual({ id: 'one', name: 'Original' });

    mutation.markCommitted({ result: 'synced' });

    expect(mutation.status).toBe('committed');
    expect(mutation.result).toBe('synced');
    expect(collection.get('one')).toEqual({ id: 'one', name: 'Original' });
  });

  it('applies partial updates via update and rolls back', async () => {
    const collection = new Collection<TestEntity>('tests');
    await collection
      .upsert({
        entity: { id: 'one', name: 'Original' },
        sync: noopSync,
        autoCommit: false,
      })
      .commit();
    const mutation = collection.update({
      id: 'one',
      patch: { name: 'Updated' },
      sync: noopSync,
      autoCommit: false,
    });

    expect(collection.get('one')).toEqual({ id: 'one', name: 'Updated' });

    mutation.rollback();

    expect(collection.get('one')).toEqual({ id: 'one', name: 'Original' });
  });

  it('records executor errors on update mutations and returns to draft', async () => {
    const collection = new Collection<TestEntity>('tests');
    await collection
      .upsert({
        entity: { id: 'one', name: 'Original' },
        sync: noopSync,
        autoCommit: false,
      })
      .commit();
    const mutation = collection.update({
      id: 'one',
      patch: { name: 'Updated' },
      sync: noopSync,
      autoCommit: false,
    });

    let thrown: Error | undefined;
    try {
      await mutation.commit(async () => {
        throw new Error('save failed');
      });
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('save failed');
    expect(mutation.status).toBe('draft');
    expect(mutation.error?.message).toBe('save failed');

    await mutation.commit();

    expect(mutation.status).toBe('committed');
  });
});
