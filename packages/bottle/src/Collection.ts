import { isEqual } from 'lodash-es';
import { observable, computed, action, makeObservable } from 'mobx';

import { foldChange } from './mutation/foldChange';
import { Mutation } from './mutation/Mutation';
import { MutationManager } from './mutation/MutationManager';
import type { EntitySnapshots } from './mutation/MutationManager';
import type { Storage } from './storage/Storage';
import type { Entity, ItemChange, ChangeHandler, DeepReadonly } from './types';
import { deepFreeze } from './utils/deepFreeze';
import { neverReached } from './utils/neverReached';

export type { EntitySnapshots };

type SyncFunction<T extends Entity> = (change: ItemChange<T>) => Promise<void>;

export class Collection<T extends Entity> {
  /**
   * Observable map storing all entities in the collection keyed by id.
   */
  protected items = observable.map<string, T>({}, { deep: false });

  /**
   * Set of change handlers subscribed to item changes in this collection.
   */
  protected handlers = new Set<ChangeHandler<T>>();

  /**
   * Manager tracking active mutations and snapshots for collection entities.
   */
  protected mutationManager: MutationManager<T>;

  /**
   * Optional storage backend for persisting collection state.
   */
  protected storage?: Storage<T>;

  /**
   * Optional callback for persisting insert operations to a remote source.
   */
  protected createCallback?: SyncFunction<T>;

  /**
   * Optional callback for persisting update operations to a remote source.
   */
  protected updateCallback?: SyncFunction<T>;

  /**
   * Optional callback for persisting delete operations to a remote source.
   */
  protected deleteCallback?: SyncFunction<T>;

  constructor(args?: {
    storage?: Storage<T>;
    create?: SyncFunction<T>;
    update?: SyncFunction<T>;
    delete?: SyncFunction<T>;
  }) {
    const { storage, create, update, delete: del } = args ?? {};
    this.storage = storage;
    this.createCallback = create;
    this.updateCallback = update;
    this.deleteCallback = del;
    this.mutationManager = new MutationManager<T>({ storage });

    makeObservable(this, {
      all: computed,
      get: action.bound,
      upsert: action.bound,
      delete: action.bound,
      update: action.bound,
      ingest: action.bound,
      remove: action.bound,
      commit: action.bound,
      rollback: action.bound,
      load: action.bound,
    });
  }

  /**
   * Hydrate collection state from the attached storage backend.
   */
  async load(): Promise<void> {
    if (!this.storage) {
      return;
    }

    const { entities, snapshots, mutations } = await this.storage.getAll();

    this.items.clear();
    this.mutationManager.clear();

    for (const entity of entities) {
      this.items.set(entity.id, deepFreeze(entity));
    }

    for (const storedMutation of mutations) {
      if (storedMutation.status !== 'draft') {
        continue;
      }

      const mutation = new Mutation<T>({
        id: storedMutation.id,
        change: storedMutation.change,
        rollbackChange: () => {
          this.rollbackMutation(mutation);
        },
        onSettled: () => {
          const currentChange = mutation.change;
          this.mutationManager.removeActiveMutation({
            id: currentChange.id,
            mutationId: mutation.id,
          });
        },
      });
      this.mutationManager.setActiveMutation(mutation);
    }

    for (const snapshot of snapshots) {
      this.mutationManager.restoreSnapshot({
        id: snapshot.id,
        original: snapshot.original ? snapshot.original : undefined,
        current: snapshot.current ? snapshot.current : undefined,
        mutationId: snapshot.mutationId,
      });
    }
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
   * Inserts or updates an entity.
   */
  upsert(args: {
    entity: T;
    onCommit?: (change: ItemChange<T>) => void;
    onError?: (error: Error) => void;
    autoCommit?: boolean;
  }): void {
    const { entity, onCommit, onError, autoCommit = true } = args;
    const change = this.applyUpsert(entity);
    if (!change) {
      return;
    }
    const mutation = this.createMutation({ change, onCommit, onError });
    if (autoCommit) {
      const executor = this.resolveExecutor(mutation.change);
      mutation.commit(executor).catch(() => {});
    }
  }

  /**
   * Applies a partial patch to an existing entity.
   */
  update(args: {
    id: string;
    patch: Partial<Omit<T, 'id'>>;
    onCommit?: (change: ItemChange<T>) => void;
    onError?: (error: Error) => void;
    autoCommit?: boolean;
  }): void {
    const { id, patch, onCommit, onError, autoCommit = true } = args;
    const existing = this.get(id);
    const updated = { ...(existing as T), ...patch, id };
    this.upsert({ entity: updated, onCommit, onError, autoCommit });
  }

  /**
   * Deletes the entity with the given id.
   */
  delete(args: {
    id: string;
    onCommit?: (change: ItemChange<T>) => void;
    onError?: (error: Error) => void;
    autoCommit?: boolean;
  }): void {
    const { id, onCommit, onError, autoCommit = true } = args;
    const change = this.applyDelete(id);
    if (!change) {
      return;
    }
    const mutation = this.createMutation({ change, onCommit, onError });
    if (autoCommit) {
      const executor = this.resolveExecutor(mutation.change);
      mutation.commit(executor).catch(() => {});
    }
  }

  /**
   * Returns the original and current snapshots for the given entity id,
   * along with whether there's an active draft mutation.
   */
  snapshot(id: string): EntitySnapshots<T> {
    const original = this.mutationManager.getOriginalSnapshot(id);
    const current = this.mutationManager.getCurrentSnapshot(id);
    const isDraft =
      this.mutationManager.getActiveMutation(id)?.status === 'draft';
    if (original !== undefined || current !== undefined) {
      return { original, current, isDraft };
    }
    return {
      original: undefined,
      current: this.get(id),
      isDraft,
    };
  }

  /**
   * Commits the active mutation for the given entity id.
   */
  commit(args: { id: string }): Promise<void> {
    const { id } = args;
    const mutation = this.mutationManager.getActiveMutation(id);
    if (!mutation) {
      throw new Error(`No active mutation for entity '${id}'`);
    }
    const executor = this.resolveExecutor(mutation.change);
    return mutation.commit(executor);
  }

  /**
   * Rolls back the active mutation for the given entity id.
   */
  rollback(args: { id: string }): void {
    const { id } = args;
    const mutation = this.mutationManager.getActiveMutation(id);
    if (!mutation) {
      throw new Error(`No active mutation for entity '${id}'`);
    }
    mutation.rollback();
  }

  /**
   * Inserts or updates an entity from an external source without creating a mutation.
   */
  ingest(args: { entity: T }): DeepReadonly<T> {
    const { entity } = args;
    const frozen = deepFreeze<T>(entity);
    this.items.set(entity.id, frozen);

    this.storage?.setEntity(frozen);

    const mutation = this.mutationManager.getActiveMutation(entity.id);
    if (mutation) {
      if (mutation.change.type === 'insert') {
        this.mutationManager.removeActiveMutation({
          id: entity.id,
          mutationId: mutation.id,
        });
      } else {
        this.mutationManager.setOriginalSnapshot({
          id: entity.id,
          original: frozen as DeepReadonly<T>,
        });
      }
    }

    // Intentionally no emit() in here
    return frozen as DeepReadonly<T>;
  }

  /**
   * Removes an entity by id from an external source without creating a mutation.
   */
  remove(args: { id: string }): DeepReadonly<T> | undefined {
    const { id } = args;
    const existing = this.items.get(id);
    if (!existing) {
      return undefined;
    }

    const frozen = existing as DeepReadonly<T>;
    this.items.delete(id);

    this.storage?.deleteEntity(id);

    const mutation = this.mutationManager.getActiveMutation(id);
    if (mutation) {
      this.mutationManager.removeActiveMutation({
        id,
        mutationId: mutation.id,
      });
    }

    // Intentionally no emit() in here
    return frozen;
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

  private applyUpsert(entity: T): ItemChange<T> | undefined {
    const existing = this.items.get(entity.id);
    const frozen = deepFreeze<T>(entity);
    if (existing && isEqual(existing, frozen)) {
      return undefined;
    }
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

    this.storage?.setEntity(frozen);

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

    this.storage?.deleteEntity(id);

    return change;
  }

  private resolveExecutor(change: ItemChange<T>): SyncFunction<T> | undefined {
    switch (change.type) {
      case 'insert': {
        return this.createCallback;
      }
      case 'update': {
        return this.updateCallback;
      }
      case 'delete': {
        return this.deleteCallback;
      }
      default: {
        neverReached(change.type);
      }
    }
  }

  private createMutation(args: {
    change: ItemChange<T>;
    onCommit?: (change: ItemChange<T>) => void;
    onError?: (error: Error) => void;
  }): Mutation<T> {
    const { change, onCommit, onError } = args;
    const activeMutation = this.mutationManager.getActiveMutation(change.id);
    if (activeMutation && activeMutation.status === 'draft') {
      return this.foldMutation({
        mutation: activeMutation,
        change,
        onCommit,
        onError,
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
        this.mutationManager.removeActiveMutation({
          id: currentChange.id,
          mutationId: mutation.id,
        });
      },
      onCommit,
      onError,
    });
    this.mutationManager.setActiveMutation(mutation);

    return mutation;
  }

  private foldMutation(args: {
    mutation: Mutation<T>;
    change: ItemChange<T>;
    onCommit?: (change: ItemChange<T>) => void;
    onError?: (error: Error) => void;
  }): Mutation<T> {
    const { mutation, change, onCommit, onError } = args;
    const previousChange = mutation.change;
    const foldedChange = foldChange({
      previousChange,
      change,
    });

    // If the folded change results in no net difference (entity == oldEntity),
    // roll back the mutation entirely so the draft is removed and the entity
    // reverts to its committed state.
    if (
      foldedChange.type === 'update' &&
      foldedChange.oldEntity &&
      isEqual(foldedChange.entity, foldedChange.oldEntity)
    ) {
      mutation.updateChange({ change: foldedChange });
      this.mutationManager.setPendingSnapshot(mutation);
      mutation.rollback();
      return mutation;
    }

    mutation.updateChange({ change: foldedChange });
    this.mutationManager.setPendingSnapshot(mutation);

    if (onCommit !== undefined) {
      mutation.onCommit = onCommit;
    }
    if (onError !== undefined) {
      mutation.onError = onError;
    }

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
