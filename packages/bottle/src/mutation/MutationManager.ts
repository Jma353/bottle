import type { DeepReadonly, Entity, ItemChange } from '../types';

import type { Mutation } from './Mutation';

export type EntitySnapshots<T extends Entity> = {
  original: DeepReadonly<T> | undefined;
  mutated: DeepReadonly<T> | undefined;
};

type PendingSnapshot<T extends Entity> = EntitySnapshots<T> & {
  mutationId: string;
};

export class MutationManager<T extends Entity> {
  private pendingSnapshots = new Map<string, PendingSnapshot<T>>();
  private activeMutations = new Map<string, Mutation<T>>();

  /**
   * Returns the mutated snapshot for the given entity id.
   */
  getMutatedSnapshot(id: string): DeepReadonly<T> | undefined {
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      return pending.mutated;
    }
    return undefined;
  }

  /**
   * Returns the original snapshot for the given entity id.
   */
  getSnapshot(id: string): DeepReadonly<T> | undefined {
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      return pending.original;
    }
    return undefined;
  }

  /**
   * Returns both original and mutated snapshots for the given entity id.
   */
  getSnapshots(id: string): EntitySnapshots<T> {
    return {
      original: this.getSnapshot(id),
      mutated: this.getMutatedSnapshot(id),
    };
  }

  /**
   * Returns the full pending snapshot record for the given entity id.
   */
  getPendingSnapshot(id: string): PendingSnapshot<T> | undefined {
    return this.pendingSnapshots.get(id);
  }

  /**
   * Returns the active mutation for the given entity id.
   */
  getActiveMutation(id: string): Mutation<T> | undefined {
    return this.activeMutations.get(id);
  }

  /**
   * Registers a mutation as active and updates its pending snapshot.
   */
  registerActiveMutation(mutation: Mutation<T>): void {
    this.activeMutations.set(mutation.change.id, mutation);
    this.setPendingSnapshot(mutation);
  }

  /**
   * Updates the pending snapshot for a mutation and cleans up stale entries.
   */
  setPendingSnapshot(mutation: Mutation<T>): void {
    const { change } = mutation;

    this.pendingSnapshots.set(change.id, {
      mutationId: mutation.id,
      original: change.oldEntity,
      mutated: change.type === 'delete' ? undefined : change.entity,
    });

    for (const [id, pending] of this.pendingSnapshots) {
      if (pending.mutationId === mutation.id && id !== change.id) {
        this.pendingSnapshots.delete(id);
      }
    }
  }

  /**
   * Removes the active mutation if it matches the given mutation id.
   */
  removeActiveMutation(id: string, mutationId: string): void {
    const active = this.activeMutations.get(id);
    if (active?.id === mutationId) {
      this.activeMutations.delete(id);
    }
  }

  /**
   * Removes the pending snapshot if it matches the given mutation id.
   */
  removePendingSnapshot(id: string, mutationId: string): void {
    const pending = this.pendingSnapshots.get(id);
    if (pending?.mutationId === mutationId) {
      this.pendingSnapshots.delete(id);
    }
  }

  /**
   * Folds a new change into a previous change to produce a single coherent change.
   */
  static foldChange<T extends Entity>(args: {
    previousChange: ItemChange<T>;
    change: ItemChange<T>;
  }): ItemChange<T> {
    const { previousChange, change } = args;
    const originalEntity = previousChange.oldEntity;

    if (change.type === 'delete') {
      return {
        type: 'delete',
        id: change.id,
        entity: change.entity,
        oldEntity: originalEntity,
      };
    }

    if (previousChange.type === 'insert') {
      return {
        type: 'insert',
        id: change.id,
        entity: change.entity,
      };
    }

    if (previousChange.type === 'delete') {
      return {
        type: originalEntity ? 'update' : 'insert',
        id: change.id,
        entity: change.entity,
        oldEntity: originalEntity,
      };
    }

    return {
      type: 'update',
      id: change.id,
      entity: change.entity,
      oldEntity: originalEntity,
    };
  }
}
