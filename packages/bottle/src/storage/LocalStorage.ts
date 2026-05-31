import type { Entity } from '../types';

import type { Storage, StoredMutation, StoredSnapshot } from './Storage';

type LocalStorageBackend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type StorageIndex = {
  entities: string[];
  snapshots: string[];
  mutations: string[];
};

/**
 * Browser localStorage implementation.
 *
 * Persists collection state to the browser's localStorage API.
 * Falls back to an in-memory map when localStorage is unavailable
 * (e.g. in test environments).
 */
export class LocalStorage<T extends Entity> implements Storage<T> {
  private readonly keyPrefix: string;
  private readonly backend: LocalStorageBackend;

  constructor(args?: { keyPrefix?: string; backend?: LocalStorageBackend }) {
    const { keyPrefix = 'bottle', backend } = args ?? {};
    this.keyPrefix = keyPrefix;
    this.backend =
      backend ??
      (typeof localStorage !== 'undefined' ? localStorage : new MapBackend());
  }

  async getAll(): Promise<{
    entities: T[];
    snapshots: StoredSnapshot<T>[];
    mutations: StoredMutation<T>[];
  }> {
    const index = this.getIndex();

    const entities: T[] = [];
    for (const id of index.entities) {
      const raw = this.backend.getItem(this.entityKey(id));
      if (raw) {
        entities.push(JSON.parse(raw));
      }
    }

    const snapshots: StoredSnapshot<T>[] = [];
    for (const id of index.snapshots) {
      const raw = this.backend.getItem(this.snapshotKey(id));
      if (raw) {
        snapshots.push(JSON.parse(raw));
      }
    }

    const mutations: StoredMutation<T>[] = [];
    for (const id of index.mutations) {
      const raw = this.backend.getItem(this.mutationKey(id));
      if (raw) {
        mutations.push(JSON.parse(raw));
      }
    }

    return { entities, snapshots, mutations };
  }

  async setEntity(entity: T): Promise<void> {
    this.backend.setItem(this.entityKey(entity.id), JSON.stringify(entity));

    const index = this.getIndex();
    if (!index.entities.includes(entity.id)) {
      index.entities.push(entity.id);
      this.backend.setItem(this.indexKey(), JSON.stringify(index));
    }
  }

  async deleteEntity(id: string): Promise<void> {
    this.backend.removeItem(this.entityKey(id));

    const index = this.getIndex();
    index.entities = index.entities.filter(eid => eid !== id);
    this.backend.setItem(this.indexKey(), JSON.stringify(index));
  }

  async setSnapshot(snapshot: StoredSnapshot<T>): Promise<void> {
    this.backend.setItem(
      this.snapshotKey(snapshot.id),
      JSON.stringify(snapshot),
    );

    const index = this.getIndex();
    if (!index.snapshots.includes(snapshot.id)) {
      index.snapshots.push(snapshot.id);
      this.backend.setItem(this.indexKey(), JSON.stringify(index));
    }
  }

  async deleteSnapshot(id: string): Promise<void> {
    this.backend.removeItem(this.snapshotKey(id));

    const index = this.getIndex();
    index.snapshots = index.snapshots.filter(sid => sid !== id);
    this.backend.setItem(this.indexKey(), JSON.stringify(index));
  }

  async setMutation(mutation: StoredMutation<T>): Promise<void> {
    this.backend.setItem(
      this.mutationKey(mutation.id),
      JSON.stringify(mutation),
    );

    const index = this.getIndex();
    if (!index.mutations.includes(mutation.id)) {
      index.mutations.push(mutation.id);
      this.backend.setItem(this.indexKey(), JSON.stringify(index));
    }
  }

  async deleteMutation(id: string): Promise<void> {
    this.backend.removeItem(this.mutationKey(id));

    const index = this.getIndex();
    index.mutations = index.mutations.filter(mid => mid !== id);
    this.backend.setItem(this.indexKey(), JSON.stringify(index));
  }

  async clear(): Promise<void> {
    const index = this.getIndex();

    for (const id of index.entities) {
      this.backend.removeItem(this.entityKey(id));
    }
    for (const id of index.snapshots) {
      this.backend.removeItem(this.snapshotKey(id));
    }
    for (const id of index.mutations) {
      this.backend.removeItem(this.mutationKey(id));
    }

    this.backend.removeItem(this.indexKey());
  }

  private indexKey(): string {
    return `${this.keyPrefix}:index`;
  }

  private entityKey(id: string): string {
    return `${this.keyPrefix}:entity:${id}`;
  }

  private snapshotKey(id: string): string {
    return `${this.keyPrefix}:snapshot:${id}`;
  }

  private mutationKey(id: string): string {
    return `${this.keyPrefix}:mutation:${id}`;
  }

  private getIndex(): StorageIndex {
    const raw = this.backend.getItem(this.indexKey());
    if (raw) {
      return JSON.parse(raw) as StorageIndex;
    }
    return { entities: [], snapshots: [], mutations: [] };
  }
}

class MapBackend implements LocalStorageBackend {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}
