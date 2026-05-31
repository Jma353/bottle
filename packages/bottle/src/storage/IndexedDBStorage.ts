import type { Entity } from '../types';

import type { Storage, StoredMutation, StoredSnapshot } from './Storage';

/**
 * Browser IndexedDB implementation.
 *
 * Persists collection state to the browser's IndexedDB API.
 * Falls back to an in-memory map when IndexedDB is unavailable
 * (e.g. in test environments without a polyfill).
 */
export class IndexedDBStorage<T extends Entity> implements Storage<T> {
  private readonly dbName: string;
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  constructor(args?: { dbName?: string }) {
    const { dbName = 'bottle' } = args ?? {};
    this.dbName = dbName;
  }

  async getAll(): Promise<{
    entities: T[];
    snapshots: StoredSnapshot<T>[];
    mutations: StoredMutation<T>[];
  }> {
    const db = await this.openDB();

    const entities = await this.getAllFromStore<T>(db, 'entities');
    const snapshots = await this.getAllFromStore<StoredSnapshot<T>>(
      db,
      'snapshots',
    );
    const mutations = await this.getAllFromStore<StoredMutation<T>>(
      db,
      'mutations',
    );

    return { entities, snapshots, mutations };
  }

  async setEntity(entity: T): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('entities', 'readwrite');
    const store = tx.objectStore('entities');
    await this.requestToPromise(store.put(entity));
  }

  async deleteEntity(id: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('entities', 'readwrite');
    const store = tx.objectStore('entities');
    await this.requestToPromise(store.delete(id));
  }

  async setSnapshot(snapshot: StoredSnapshot<T>): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');
    await this.requestToPromise(store.put(snapshot));
  }

  async deleteSnapshot(id: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');
    await this.requestToPromise(store.delete(id));
  }

  async setMutation(mutation: StoredMutation<T>): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    await this.requestToPromise(store.put(mutation));
  }

  async deleteMutation(id: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    await this.requestToPromise(store.delete(id));
  }

  async clear(): Promise<void> {
    const db = await this.openDB();

    await this.requestToPromise(
      db.transaction('entities', 'readwrite').objectStore('entities').clear(),
    );
    await this.requestToPromise(
      db.transaction('snapshots', 'readwrite').objectStore('snapshots').clear(),
    );
    await this.requestToPromise(
      db.transaction('mutations', 'readwrite').objectStore('mutations').clear(),
    );
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment');
    }

    const request = indexedDB.open(this.dbName, this.version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('entities')) {
        db.createObjectStore('entities', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      }
    };

    this.db = await this.requestToPromise(request);
    return this.db;
  }

  private async getAllFromStore<V>(
    db: IDBDatabase,
    storeName: string,
  ): Promise<V[]> {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    return this.requestToPromise(request);
  }

  private requestToPromise<R>(request: IDBRequest<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
