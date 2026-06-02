# posts playground

A full-featured example of `bottle` with a backend, optimistic mutations, and commit/rollback.

## What it shows

- Collections synced to an Express + SQLite backend
- Optimistic `create`, `update`, and `delete` with server callbacks
- Pending mutations tracked per-item
- Manual `commit` and `rollback` of drafted changes
- A live change log rendered from `collection.onChange` listeners
- Offline storage via `StorageAdapter` with `localStorage` fallback

## Running

Start the dev server and backend concurrently:

```sh
pnpm dev:all
```

Or run each separately:

```sh
pnpm dev     # Vite dev server
pnpm server  # Express API on http://localhost:3001
```
