# bottle

<p align="center">
  <img src="assets/bottle.png" width="200" />
</p>

Lightweight reactive collections for normalized client data with mutations.

## Install

```sh
pnpm add bottle
```

## Collection

`Collection<T>` stores entities by required string `id`. Reads return frozen
readonly snapshots, so callers update state through collection APIs instead of
mutating returned objects.

```ts
import { Collection } from 'bottle';

type Post = { id: string; title: string; published: boolean };
const posts = new Collection<Post>();

posts.upsert({
  entity: { id: 'post-1', title: 'Hello', published: false },
  sync: async change => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(change.entity),
    });
  },
});

console.log(posts.get('post-1'));
```

`upsert` inserts or replaces one entity. `delete` removes an entity by id.
Both apply optimistically.

```ts
posts.delete({ id: 'post-1' });
```

## Ingest

`ingest` inserts or updates an entity from an external source without creating
a mutation or emitting change events. Use it when hydrating the collection from
a server response.

```ts
for (const post of serverPosts) {
  posts.ingest({ entity: post });
}
```

`remove` deletes an entity by id from an external source without creating a
mutation or emitting change events. Use it when syncing deletions from a server.

```ts
for (const id of deletedPostIds) {
  posts.remove({ id });
}
```

## Reads and listeners

Use `get`, `all`, `find`, and `filter` to read the current optimistic state.
All returned values and arrays are deeply frozen.

```ts
const post = posts.get('post-1');
const all = posts.all;
const draft = posts.find(p => !p.published);
const published = posts.filter(p => p.published);
```

`onChange` emits an `ItemChange` every time an entity is inserted, updated, or
deleted. The returned function unsubscribes the handler.

```ts
const stop = posts.onChange(change => {
  console.log(change.type, change.id);
});
stop();
```

## Mutations

`upsert`, `update`, and `delete` all create an active mutation and auto-commit
it by default. Pass `autoCommit: false` to queue the change instead. Each accepts
an optional `onError` callback for handling sync failures.

```ts
posts.upsert({
  entity: { id: 'post-2', title: 'Draft', published: false },
  autoCommit: false,
});

await posts.commit({
  id: 'post-2',
  sync: async change => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(change.entity),
    });
  },
});
```

Use `snapshot` to inspect the original and current state of an entity while a
mutation is pending:

```ts
const { original, current } = posts.snapshot('post-2');
```

Roll back a draft or pending mutation for an entity:

```ts
posts.rollback({ id: 'post-2' });
```

Draft changes for the same entity fold into one active mutation. Later changes
made while a previous mutation is already pending create a separate mutation.

`Collection#update` applies partial optimistic updates:

```ts
posts.update({
  id: 'post-1',
  patch: { published: true },
  sync: async change => {
    await fetch(`/api/posts/${change.id}`, {
      method: 'PATCH',
      body: JSON.stringify(change.entity),
    });
  },
});
```
