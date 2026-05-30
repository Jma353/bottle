import { describe, expect, it } from '@rstest/core';

import { Mutation } from './Mutation';
import { MutationManager } from './MutationManager';

type TestEntity = {
  id: string;
  name: string;
  meta: {
    count: number;
  };
};

describe('MutationManager', () => {
  it('returns undefined for snapshots when no mutation is active', () => {
    const manager = new MutationManager<TestEntity>();

    expect(manager.getSnapshot('one')).toBeUndefined();
    expect(manager.getMutatedSnapshot('one')).toBeUndefined();
    expect(manager.getSnapshots('one')).toEqual({
      original: undefined,
      mutated: undefined,
    });
  });

  it('tracks snapshots for an insert mutation', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);

    expect(manager.getSnapshot('one')).toBeUndefined();
    expect(manager.getMutatedSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(manager.getSnapshots('one')).toEqual({
      original: undefined,
      mutated: {
        id: 'one',
        name: 'Original',
        meta: { count: 1 },
      },
    });
  });

  it('tracks snapshots for an update mutation', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'update',
        id: 'one',
        entity: { id: 'one', name: 'Updated', meta: { count: 2 } },
        oldEntity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);

    expect(manager.getSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(manager.getMutatedSnapshot('one')).toEqual({
      id: 'one',
      name: 'Updated',
      meta: { count: 2 },
    });
  });

  it('tracks snapshots for a delete mutation', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'delete',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
        oldEntity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);

    expect(manager.getSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(manager.getMutatedSnapshot('one')).toBeUndefined();
  });

  it('clears snapshots when a pending snapshot is removed', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);
    manager.removePendingSnapshot('one', mutation.id);

    expect(manager.getSnapshot('one')).toBeUndefined();
    expect(manager.getMutatedSnapshot('one')).toBeUndefined();
  });

  it('removes the active mutation without clearing the pending snapshot', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);
    manager.removeActiveMutation('one', mutation.id);

    expect(manager.getActiveMutation('one')).toBeUndefined();
    expect(manager.getMutatedSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
  });

  it('returns the pending snapshot metadata', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);

    const pending = manager.getPendingSnapshot('one');
    expect(pending).toEqual({
      mutationId: mutation.id,
      original: undefined,
      mutated: { id: 'one', name: 'Original', meta: { count: 1 } },
    });
  });

  it('returns the active mutation', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.registerActiveMutation(mutation);

    expect(manager.getActiveMutation('one')).toBe(mutation);
  });
});
