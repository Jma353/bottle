import type { DeepReadonly, Entity } from '../types';

import type { Mutation } from './Mutation';

export type EntitySnapshots<T extends Entity> = {
  original: DeepReadonly<T> | undefined;
  current: DeepReadonly<T> | undefined;
};

type PendingSnapshot<T extends Entity> = EntitySnapshots<T> & {
  mutationId: string;
};

export class MutationManager<T extends Entity> {
  private pendingSnapshots = new Map<string, PendingSnapshot<T>>();
  private activeMutations = new Map<string, Mutation<T>>();

  /**
   * Returns the current snapshot for the given entity id.
   */
  getCurrentSnapshot(id: string): DeepReadonly<T> | undefined {
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      return pending.current;
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
      current: this.getCurrentSnapshot(id),
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
      current: change.type === 'delete' ? undefined : change.entity,
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
   * Updates the original snapshot for the given entity id.
   */
  updateOriginalSnapshot(id: string, original: DeepReadonly<T>): void {
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      pending.original = original;
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
}
