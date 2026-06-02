import type {
  DeepReadonly,
  Entity,
  ItemChange,
  MutationStatus,
} from '../types';

/**
 * Plain snapshot representation suitable for serialization by a storage backend.
 */
export type StoredSnapshot<T extends Entity> = {
  id: string;
  original: DeepReadonly<T> | undefined;
  current: DeepReadonly<T> | undefined;
  mutationId: string;
};

/**
 * Plain mutation representation suitable for serialization by a storage backend.
 */
export type StoredMutation<T extends Entity> = {
  id: string;
  change: ItemChange<T>;
  status: MutationStatus;
};

/**
 * Generic storage interface for persisting collection state.
 */
export interface Storage<T extends Entity> {
  /**
   * Load the entire persisted state.
   */
  getAll(): Promise<{
    entities: T[];
    snapshots: StoredSnapshot<T>[];
    mutations: StoredMutation<T>[];
  }>;

  /**
   * Persist an entity.
   */
  setEntity(entity: T): Promise<void>;

  /**
   * Remove an entity from storage.
   */
  deleteEntity(id: string): Promise<void>;

  /**
   * Persist a snapshot.
   */
  setSnapshot(snapshot: StoredSnapshot<T>): Promise<void>;

  /**
   * Remove a snapshot from storage.
   */
  deleteSnapshot(id: string): Promise<void>;

  /**
   * Persist a mutation.
   */
  setMutation(mutation: StoredMutation<T>): Promise<void>;

  /**
   * Remove a mutation from storage.
   */
  deleteMutation(id: string): Promise<void>;

  /**
   * Wipe all stored data for this collection.
   */
  clear(): Promise<void>;
}
