# bottle

<p align="center">
  <img src="assets/bottle.png" width="200" />
</p>

Lightweight reactive collections for normalized client data with mutations and optional offline storage. Built on MobX.

## Install

```sh
pnpm add bottle
```

## Philosophy

Bottle puts `Collection` at the center of everything. There is no opinionated server-sync layer — `put` and `evict` give you simple hooks to hydrate from any data source. Offline storage is pluggable via the `Storage` interface. Mutations are first-class and on by default: every write is optimistic, tracks pending state, and exposes a simple `commit` / `rollback` interface on `Collection`. Mutations can be auto-committed or drafted, giving clients flexibility over how data is changed and synced. Any draft / pending changes are available via a small `snapshot` API on `Collection`.

```
Client Code → Collection<T> → Mutation Manager / Mutation Queue / Storage (pluggable)
```

## Collection

`Collection<T>` stores entities by required string `id`. Every read, write, sync, and listener lives on the collection itself.

### Writing data

`create` inserts or updates one entity. `update` applies a partial optimistic patch. `delete` removes an entity by id. All apply optimistically and can sync to a server automatically when the collection is configured with `create`, `update`, and `delete` callbacks.

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

posts.update({
  id: 'post-1',
  patch: { published: true },
});

posts.delete({ id: 'post-1' });
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

`put` inserts or updates an entity from an external source without creating a mutation or emitting change events. `evict` deletes by id without creating a mutation or emitting change events. Use these when syncing server state into the collection.

```ts
for (const post of serverPosts) {
  posts.put({ entity: post });
}

for (const id of deletedPostIds) {
  posts.evict({ id });
}
```

### Draft and pending mutations

By default, `create`, `update`, and `delete` auto-commit. Pass `autoCommit: false` to queue the change as a **draft** instead. Drafts are local, uncommitted mutations that fold into one active mutation per entity. You can keep editing, inspect the diff, then commit or roll back when ready.

```ts
posts.create({
  entity: { id: 'post-2', title: 'Draft', published: false },
  autoCommit: false,
});

// keep editing — folds into the same draft
posts.update({ id: 'post-2', patch: { title: 'Better Draft' } });

await posts.commit({ id: 'post-2' });
```

Use `snapshot` to inspect the original and current state of an entity while a draft or pending mutation is active:

```ts
const { original, current } = posts.snapshot('post-2');
```

Roll back a draft or pending mutation:

```ts
posts.rollback({ id: 'post-2' });
```

Use `uncommittedIds` to get the ids of all entities that currently have a draft or pending mutation:

```ts
const ids = posts.uncommittedIds;
```

Once a draft is committed, the mutation runs through the collection's sync callback. If a new change is made while a mutation is already in-flight, it becomes a separate mutation that queues behind the pending one.

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

## Data modeling

Entities should be self-contained. They can reference other entities by `id`, but should never hold direct object references.

```ts
// Good — normalized
posts.create({ entity: { id: '1', title: 'Hello', authorId: 'user-1' } });

// Bad — nested object reference
posts.create({ entity: { id: '1', title: 'Hello', author: userObject } });
```

This matters because:

- **Returned data is deeply frozen.** `get`, `all`, and `filter` return immutable copies. Object references cannot be frozen in place without breaking the original graph.
- **Mutations must be trackable.** If `post.author` were a live reference, mutating it directly would bypass the collection — no optimistic patch, no rollback, no sync.
- **Storage requires serializable data.** Drafts, snapshots, and offline persistence all depend on plain, cloneable objects. References break serialization to stable storage solutions like `localStorage`, `IndexedDB`, and `SQLite`.
- **Single source of truth.** When `author` updates, every post referencing it by `id` sees the new value automatically via `get()`. With direct references you would need to update every post manually.

## Use in React

Because `Collection` is built on MobX, components re-render automatically when observed data changes. Wrap components with `observer` and read directly from the collection in render.

```tsx
import { Collection } from 'bottle';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

type Todo = { id: string; text: string; done: boolean };

const todos = new Collection<Todo>();

const TodoList = observer(() => {
  const [text, setText] = useState('');
  const all = todos.all;

  const handleAdd = () => {
    if (!text.trim()) {
      return;
    }
    todos.create({ entity: { id: crypto.randomUUID(), text, done: false } });
    setText('');
  };

  return (
    <div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="New todo"
      />
      <button onClick={handleAdd}>Add</button>
      <ul>
        {all.map(todo => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => {
                todos.update({ id: todo.id, patch: { done: !todo.done } });
              }}
            >
              Toggle
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
```
