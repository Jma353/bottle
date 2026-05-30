import { observable, computed, action, makeObservable } from 'mobx';

import { Mutation } from './mutation/Mutation';
import { MutationManager } from './mutation/MutationManager';
import type { EntitySnapshots } from './mutation/MutationManager';
import type { Entity, ItemChange, ChangeHandler, DeepReadonly } from './types';
import { deepFreeze } from './utils/deepFreeze';

export type { EntitySnapshots };

export class Collection<T extends Entity> {
  private items = observable.map<string, T>({}, { deep: false });
  private handlers = new Set<ChangeHandler<T>>();
  private mutationManager = new MutationManager<T>();

  constructor() {
    makeObservable(this, {
      all: computed,
      get: action.bound,
      upsert: action.bound,
      delete: action.bound,
      update: action.bound,
      ingest: action.bound,
    });
  }

  /**
   * Returns all entities in the collection as deep-readonly snapshots.
   */
  get all(): readonly DeepReadonly<T>[] {
    const entities: DeepReadonly<T>[] = [];
    for (const entity of this.items.values()) {
      entities.push(entity as DeepReadonly<T>);
    }
    return Object.freeze(entities);
  }

  /**
   * Returns the entity with the given id, or undefined if not found.
   */
  get(id: string): DeepReadonly<T> | undefined {
    return this.items.get(id) as DeepReadonly<T> | undefined;
  }

  /**
   * Returns the first entity that matches the predicate, or undefined.
   */
  find(
    predicate: (entity: DeepReadonly<T>) => boolean,
  ): DeepReadonly<T> | undefined {
    for (const entity of this.items.values()) {
      const readonlyEntity = entity as DeepReadonly<T>;
      if (predicate(readonlyEntity)) {
        return readonlyEntity;
      }
    }
    return undefined;
  }

  /**
   * Returns all entities that match the predicate.
   */
  filter(
    predicate: (entity: DeepReadonly<T>) => boolean,
  ): readonly DeepReadonly<T>[] {
    const result: DeepReadonly<T>[] = [];
    for (const entity of this.items.values()) {
      const readonlyEntity = entity as DeepReadonly<T>;
      if (predicate(readonlyEntity)) {
        result.push(readonlyEntity);
      }
    }
    return Object.freeze(result);
  }

  /**
   * Inserts or updates an entity and returns a mutation tracking the change.
   */
  upsert(args: {
    entity: T;
    sync: (change: ItemChange<T>) => Promise<void>;
    autoCommit?: boolean;
  }): Mutation<T> {
    const { entity, sync, autoCommit = true } = args;
    const change = this.applyUpsert(entity);
    const mutation = this.createMutation(change);
    if (autoCommit) {
      mutation.commit(sync).catch(() => {});
    }
    return mutation;
  }

  /**
   * Applies a partial patch to an existing entity and returns a mutation tracking the change.
   */
  update(args: {
    id: string;
    patch: Partial<Omit<T, 'id'>>;
    sync: (change: ItemChange<T>) => Promise<void>;
    autoCommit?: boolean;
  }): Mutation<T> {
    const { id, patch, sync, autoCommit = true } = args;
    const existing = this.get(id);
    const updated = { ...(existing as T), ...patch, id } as T;
    return this.upsert({ entity: updated, sync, autoCommit });
  }

  /**
   * Deletes the entity with the given id and returns a mutation, or undefined if not found.
   */
  delete(args: {
    id: string;
    sync: (change: ItemChange<T>) => Promise<void>;
    autoCommit?: boolean;
  }): Mutation<T> | undefined {
    const { id, sync, autoCommit = true } = args;
    const change = this.applyDelete(id);
    if (!change) {
      return undefined;
    }
    const mutation = this.createMutation(change);
    if (autoCommit) {
      mutation.commit(sync).catch(() => {});
    }
    return mutation;
  }

  /**
   * Inserts or updates an entity from an external source without creating a mutation.
   */
  ingest(args: { entity: T }): DeepReadonly<T> {
    const { entity } = args;
    const frozen = deepFreeze(entity);
    this.items.set(entity.id, frozen);
    return frozen as DeepReadonly<T>;
  }

  /**
   * Registers a handler to be called on every item change; returns an unsubscribe function.
   */
  onChange(handler: ChangeHandler<T>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private applyUpsert(entity: T): ItemChange<T> {
    const existing = this.items.get(entity.id);
    const frozen = deepFreeze(entity);
    const change: ItemChange<T> = {
      type: existing ? 'update' : 'insert',
      id: entity.id,
      entity: frozen as DeepReadonly<T>,
    };
    if (existing) {
      change.oldEntity = existing as DeepReadonly<T>;
    }
    this.items.set(entity.id, frozen);
    this.emit(change);

    return change;
  }

  private applyDelete(id: string): ItemChange<T> | undefined {
    const existing = this.items.get(id);
    if (!existing) {
      return undefined;
    }

    const change: ItemChange<T> = {
      type: 'delete',
      id,
      entity: existing as DeepReadonly<T>,
      oldEntity: existing as DeepReadonly<T>,
    };
    this.emit(change);
    this.items.delete(id);
    return change;
  }

  private createMutation(change: ItemChange<T>): Mutation<T> {
    const activeMutation = this.mutationManager.getActiveMutation(change.id);
    if (activeMutation && activeMutation.status === 'draft') {
      return this.foldMutation({
        mutation: activeMutation,
        change,
      });
    }

    let mutation: Mutation<T>;
    mutation = new Mutation<T>({
      change,
      rollbackChange: () => {
        this.rollbackMutation(mutation);
      },
      onSettled: () => {
        const currentChange = mutation.change;
        this.mutationManager.removePendingSnapshot(
          currentChange.id,
          mutation.id,
        );
        this.mutationManager.removeActiveMutation(
          currentChange.id,
          mutation.id,
        );
      },
    });
    this.mutationManager.registerActiveMutation(mutation);

    return mutation;
  }

  private foldMutation(args: {
    mutation: Mutation<T>;
    change: ItemChange<T>;
  }): Mutation<T> {
    const { mutation, change } = args;
    const previousChange = mutation.change;
    const foldedChange = MutationManager.foldChange({
      previousChange,
      change,
    });

    mutation.updateChange({ change: foldedChange });
    this.mutationManager.setPendingSnapshot(mutation);

    return mutation;
  }

  private rollbackMutation(mutation: Mutation<T>): void {
    const { change } = mutation;

    if (!this.isCurrentMutationSnapshot({ change })) {
      return;
    }

    if (change.type === 'insert') {
      this.applyDelete(change.id);
      return;
    }

    if (change.oldEntity) {
      this.applyUpsert(change.oldEntity as T);
      return;
    }
  }

  private isCurrentMutationSnapshot(args: { change: ItemChange<T> }): boolean {
    const { change } = args;
    const current = this.items.get(change.id);

    if (change.type === 'delete') {
      return current === undefined;
    }

    return current === change.entity;
  }

  private emit(change: ItemChange<T>): void {
    for (const handler of this.handlers) {
      handler(change);
    }
  }
}
