import { observable } from 'mobx';

import type { DeepReadonly, Entity } from '../types';

import type { Mutation } from './Mutation';

export type EntitySnapshots<T extends Entity> = {
  original: DeepReadonly<T> | undefined;
  current: DeepReadonly<T> | undefined;
  isDraft: boolean;
};

type PendingSnapshot<T extends Entity> = EntitySnapshots<T> & {
  mutationId: string;
};

export class MutationManager<T extends Entity> {
  private pendingSnapshots = observable.map<string, PendingSnapshot<T>>();
  private activeMutations = observable.map<string, Mutation<T>>();

  /**
   * Returns the active mutation for the given entity id.
   */
  getActiveMutation(id: string): Mutation<T> | undefined {
    return this.activeMutations.get(id);
  }

  /**
   * Registers a mutation as active and updates its pending snapshot.
   */
  setActiveMutation(mutation: Mutation<T>): void {
    this.activeMutations.set(mutation.change.id, mutation);
    this.setPendingSnapshot(mutation);
  }

  /**
   * Removes the active mutation if it matches the given mutation id.
   */
  removeActiveMutation(args: { id: string; mutationId: string }): void {
    const { id, mutationId } = args;
    const active = this.activeMutations.get(id);
    if (active?.id === mutationId) {
      this.activeMutations.delete(id);
    }
  }

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
  getOriginalSnapshot(id: string): DeepReadonly<T> | undefined {
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      return pending.original;
    }
    return undefined;
  }

  /**
   * Updates the original snapshot for the given entity id.
   */
  setOriginalSnapshot(args: { id: string; original: DeepReadonly<T> }): void {
    const { id, original } = args;
    const pending = this.pendingSnapshots.get(id);
    if (pending) {
      pending.original = original;
    }
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
      isDraft: mutation.status === 'draft',
    });

    for (const [id, pending] of this.pendingSnapshots) {
      if (pending.mutationId === mutation.id && id !== change.id) {
        this.pendingSnapshots.delete(id);
      }
    }
  }

  /**
   * Removes the pending snapshot if it matches the given mutation id.
   */
  removePendingSnapshot(args: { id: string; mutationId: string }): void {
    const { id, mutationId } = args;
    const pending = this.pendingSnapshots.get(id);
    if (pending?.mutationId === mutationId) {
      this.pendingSnapshots.delete(id);
    }
  }
}
