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

    expect(manager.getOriginalSnapshot('one')).toBeUndefined();
    expect(manager.getCurrentSnapshot('one')).toBeUndefined();
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

    manager.setActiveMutation(mutation);

    expect(manager.getOriginalSnapshot('one')).toBeUndefined();
    expect(manager.getCurrentSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
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

    manager.setActiveMutation(mutation);

    expect(manager.getOriginalSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(manager.getCurrentSnapshot('one')).toEqual({
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

    manager.setActiveMutation(mutation);

    expect(manager.getOriginalSnapshot('one')).toEqual({
      id: 'one',
      name: 'Original',
      meta: { count: 1 },
    });
    expect(manager.getCurrentSnapshot('one')).toBeUndefined();
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

    manager.setActiveMutation(mutation);
    manager.removePendingSnapshot({ id: 'one', mutationId: mutation.id });

    expect(manager.getOriginalSnapshot('one')).toBeUndefined();
    expect(manager.getCurrentSnapshot('one')).toBeUndefined();
  });

  it('removes the active mutation and clears the pending snapshot', () => {
    const manager = new MutationManager<TestEntity>();
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'insert',
        id: 'one',
        entity: { id: 'one', name: 'Original', meta: { count: 1 } },
      },
      rollbackChange: () => {},
    });

    manager.setActiveMutation(mutation);
    manager.removeActiveMutation({ id: 'one', mutationId: mutation.id });

    expect(manager.getActiveMutation('one')).toBeUndefined();
    expect(manager.getCurrentSnapshot('one')).toBeUndefined();
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

    manager.setActiveMutation(mutation);

    expect(manager.getActiveMutation('one')).toBe(mutation);
  });
});
