# bottle

<p align="center">
  <img src="assets/bottle.png" width="200" />
</p>

Lightweight reactive store for normalized client data with mutations and optional offline storage.

## Install

```sh
pnpm add bottle
```

## Collection

`Collection<T>` stores entities by required string `id`. Every read, write, sync, and listener lives on the collection itself.

### Writing data

`create` inserts or updates one entity. `delete` removes an entity by id. Both apply optimistically and can sync to a server automatically when the collection is configured with `create`, `update`, and `delete` callbacks.

```ts
import { Collection } from 'bottle';

type Post = { id: string; title: string; published: boolean };
const posts = new Collection<Post>({
  create: async change => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(change.entity),
    });
  },
  update: async change => {
    await fetch(`/api/posts/${change.id}`, {
      method: 'PATCH',
      body: JSON.stringify(change.entity),
    });
  },
  delete: async change => {
    await fetch(`/api/posts/${change.id}`, {
      method: 'DELETE',
    });
  },
});

posts.create({
  entity: { id: 'post-1', title: 'Hello', published: false },
});

posts.delete({ id: 'post-1' });
```

`update` applies a partial optimistic patch:

```ts
posts.update({
  id: 'post-1',
  patch: { published: true },
});
```

### Reading data

Use `get`, `all`, `find`, and `filter`. All returned values and arrays are deeply frozen so you cannot mutate state outside the collection's APIs.

```ts
const post = posts.get('post-1');
const all = posts.all;
const draft = posts.find(p => !p.published);
const published = posts.filter(p => p.published);
```

### Reacting to changes

`onChange` emits an event every time an entity is inserted, updated, or deleted. The returned function unsubscribes the handler.

```ts
const stop = posts.onChange(change => {
  console.log(change.type, change.id);
});
stop();
```

### Hydrating from a server

`ingest` inserts or updates an entity from an external source without creating a mutation or emitting change events. `remove` deletes by id without creating a mutation or emitting change events. Use these when syncing server state into the collection.

```ts
for (const post of serverPosts) {
  posts.ingest({ entity: post });
}

for (const id of deletedPostIds) {
  posts.remove({ id });
}
```

### Drafts and pending mutations

By default, `create`, `update`, and `delete` auto-commit. Pass `autoCommit: false` to queue the change instead. Each accepts optional `onCommit` and `onError` callbacks.

```ts
posts.create({
  entity: { id: 'post-2', title: 'Draft', published: false },
  autoCommit: false,
});

await posts.commit({ id: 'post-2' });
```

Use `snapshot` to inspect the original and current state of an entity while a mutation is pending:

```ts
const { original, current } = posts.snapshot('post-2');
```

Roll back a draft or pending mutation:

```ts
posts.rollback({ id: 'post-2' });
```

Draft changes for the same entity fold into one active mutation. Later changes made while a previous mutation is already pending create a separate mutation.

### Offline storage

Pass a `Storage` backend to the constructor to persist entities, snapshots, and mutations across page reloads. Call `load` once before using the collection to hydrate from storage.

```ts
import { Collection, LocalStorage } from 'bottle';

const posts = new Collection<Post>({
  storage: new LocalStorage({ keyPrefix: 'posts' }),
});

await posts.load();
```

`LocalStorage` writes to the browser's `localStorage` API and falls back to an in-memory map when unavailable. `IndexedDBStorage` writes to `IndexedDB` and is better suited for larger datasets:

```ts
import { IndexedDBStorage } from 'bottle';

const posts = new Collection<Post>({
  storage: new IndexedDBStorage({ dbName: 'posts' }),
});
```

When storage is attached, draft and pending mutations are restored automatically on `load`, so users can continue editing where they left off. You can also build a custom backend by implementing the `Storage` interface.
