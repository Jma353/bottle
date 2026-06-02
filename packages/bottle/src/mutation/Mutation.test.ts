import { describe, expect, it } from '@rstest/core';

import { Mutation } from './Mutation';

type TestEntity = {
  id: string;
  name: string;
};

describe('Mutation', () => {
  it('calls onError and keeps the mutation as draft on failure', async () => {
    let settled = false;
    let errorReceived: Error | undefined;
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
      onSettled: () => {
        settled = true;
      },
      onError: (error: Error) => {
        errorReceived = error;
      },
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
    expect(errorReceived?.message).toBe('save failed');
    expect(settled).toBe(false);
  });

  it('rolls back changes before commit and rejects later commits', async () => {
    let rollbackCalls = 0;
    const rollback = () => {
      rollbackCalls += 1;
    };
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: rollback,
    });

    mutation.rollback();
    mutation.rollback();

    expect(rollbackCalls).toBe(1);

    let thrown: Error | undefined;
    try {
      await mutation.commit();
    } catch (err) {
      thrown = err instanceof Error ? err : new Error(String(err));
    }

    expect(thrown?.message).toBe('Cannot commit a rolled-back mutation');
  });

  it('rejects rollback after commit', async () => {
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
    });

    await mutation.commit();

    expect(() => {
      mutation.rollback();
    }).toThrow('Cannot rollback a committed mutation');
  });

  it('calls onCommit when marked committed', () => {
    let committed = false;
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
      onCommit: () => {
        committed = true;
      },
    });

    mutation.markPending();
    mutation.markCommitted();

    expect(committed).toBe(true);
  });

  it('can be marked pending and committed without a transport executor', () => {
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
    });

    mutation.markPending();

    expect(mutation.status).toBe('pending');

    mutation.markCommitted({ result: 'synced' });

    expect(mutation.status).toBe('committed');
    expect(mutation.result).toBe('synced');
  });

  it('transitions status through commit', async () => {
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
    });

    expect(mutation.status).toBe('draft');

    mutation.markPending();
    expect(mutation.status).toBe('pending');

    mutation.markCommitted();
    expect(mutation.status).toBe('committed');
  });

  it('updates change while in draft status', () => {
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
    });

    mutation.updateChange({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Updated' },
      },
    });

    expect(mutation.change.entity).toEqual({ id: 'one', name: 'Updated' });
  });

  it('rejects change updates when not in draft', () => {
    const mutation = new Mutation<TestEntity>({
      change: {
        type: 'create',
        id: 'one',
        entity: { id: 'one', name: 'Original' },
      },
      rollbackChange: () => {},
    });

    mutation.markPending();

    expect(() => {
      mutation.updateChange({
        change: {
          type: 'create',
          id: 'one',
          entity: { id: 'one', name: 'Updated' },
        },
      });
    }).toThrow("Cannot update mutation in status 'pending'");
  });
});
