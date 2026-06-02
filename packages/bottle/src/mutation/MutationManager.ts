import { observable } from 'mobx';

import type { Storage } from '../storage/Storage';
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
  /**
   * Map of entity ids to their pending snapshots during active mutations.
   */
  private pendingSnapshots = observable.map<string, PendingSnapshot<T>>();

  /**
   * Map of entity ids to their currently active mutations.
   */
  private activeMutations = observable.map<string, Mutation<T>>();

  /**
   * Optional storage backend for persisting mutation state.
   */
  private storage?: Storage<T>;

  constructor(args?: { storage?: Storage<T> }) {
    const { storage } = args ?? {};
    this.storage = storage;
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
  setActiveMutation(mutation: Mutation<T>): void {
    this.activeMutations.set(mutation.change.id, mutation);
    this.setPendingSnapshot(mutation);
  }

  /**
   * Removes the active mutation and its pending snapshot if they match the given mutation id.
   */
  removeActiveMutation(args: { id: string; mutationId: string }): void {
    const { id, mutationId } = args;
    const active = this.activeMutations.get(id);
    if (active?.id === mutationId) {
      this.activeMutations.delete(id);
    }
    const pending = this.pendingSnapshots.get(id);
    if (pending?.mutationId === mutationId) {
      this.pendingSnapshots.delete(id);
    }

    this.storage?.deleteMutation(mutationId);
    this.storage?.deleteSnapshot(id);
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
      this.storage?.setSnapshot({
        id,
        original: pending.original,
        current: pending.current,
        mutationId: pending.mutationId,
      });
    }
  }

  /**
   * Updates the pending snapshot for a mutation and cleans up stale entries.
   */
  setPendingSnapshot(mutation: Mutation<T>): void {
    const { change } = mutation;

    const snapshot = {
      mutationId: mutation.id,
      original: change.oldEntity,
      current: change.type === 'delete' ? undefined : change.entity,
      isDraft: mutation.status === 'draft',
    };

    this.pendingSnapshots.set(change.id, snapshot);

    for (const [id, pending] of this.pendingSnapshots) {
      if (pending.mutationId === mutation.id && id !== change.id) {
        this.pendingSnapshots.delete(id);
      }
    }

    this.storage?.setSnapshot({
      id: change.id,
      original: snapshot.original,
      current: snapshot.current,
      mutationId: snapshot.mutationId,
    });

    this.storage?.setMutation({
      id: mutation.id,
      change: mutation.change,
      status: mutation.status,
    });
  }

  /**
   * Removes the pending snapshot if it matches the given mutation id.
   */
  removePendingSnapshot(args: { id: string; mutationId: string }): void {
    const { id, mutationId } = args;
    const pending = this.pendingSnapshots.get(id);
    if (pending?.mutationId === mutationId) {
      this.pendingSnapshots.delete(id);
      this.storage?.deleteSnapshot(id);
    }
  }

  /**
   * Restore a snapshot directly during hydration.
   */
  restoreSnapshot(args: {
    id: string;
    original: DeepReadonly<T> | undefined;
    current: DeepReadonly<T> | undefined;
    mutationId: string;
  }): void {
    const { id, original, current, mutationId } = args;
    const active = this.activeMutations.get(id);
    const isDraft = active?.id === mutationId && active.status === 'draft';
    this.pendingSnapshots.set(id, {
      mutationId,
      original,
      current,
      isDraft,
    });
  }

  /**
   * Returns entity ids that have an active mutation with draft or pending status.
   */
  getMutatingIds(): readonly string[] {
    const ids: string[] = [];
    for (const [id, mutation] of this.activeMutations) {
      if (mutation.status === 'draft' || mutation.status === 'pending') {
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Clear all in-memory mutation and snapshot state.
   */
  clear(): void {
    this.activeMutations.clear();
    this.pendingSnapshots.clear();
  }
}
