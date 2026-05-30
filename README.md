# bottle

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
const posts = new Collection<Post>('posts');

const mutation = posts.upsert({
  entity: { id: 'post-1', title: 'Hello', published: false },
  sync: async change => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(change.entity),
    });
    return change.entity;
  },
});

console.log(posts.get('post-1'));
```

`upsert` inserts or replaces one entity. `delete` removes an entity by id.
Both apply optimistically and return a `Mutation`.

```ts
const insert = posts.upsert({
  entity: { id: 'post-2', title: 'Draft', published: false },
  sync: async change => change.entity,
  autoCommit: false,
});

const remove = posts.delete({
  id: 'post-2',
  sync: async change => change.entity,
  autoCommit: false,
});

insert.rollback();
remove?.rollback();
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

## Mutation lifecycle

Collection changes create `Mutation` objects with `draft`, `pending`, and
`committed` states. `commit` marks the mutation pending, runs the sync
function, and marks it committed on success. Failed commits return to `draft`
and store the error on the mutation.

```ts
const mutation = posts.upsert({
  entity: { id: 'post-3', title: 'Queued', published: false },
  sync: async change => change.entity,
  autoCommit: false,
});

mutation.markPending();
mutation.markCommitted({ result: { syncedAt: Date.now() } });
```

Draft changes for the same entity fold into one active mutation. Later changes
made while a previous mutation is already pending create a separate mutation.

`Collection#update` creates a `Mutation` for partial optimistic updates:

```ts
const update = posts.update({
  id: 'post-1',
  patch: { published: true },
  sync: async change => {
    await fetch(`/api/posts/${change.id}`, {
      method: 'PATCH',
      body: JSON.stringify(change.entity),
    });
    return change.entity;
  },
});
```
