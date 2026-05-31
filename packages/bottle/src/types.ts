/**
 * Base entity type that all domain entities must extend.
 * Provides the minimum structure needed for identification in the store.
 */
export type Entity = {
  id: string;
};

/**
 * Enumerates the kinds of mutations that can occur on an item in the store.
 * Used to categorize changes when broadcasting updates to subscribers.
 */
export type ChangeType = 'create' | 'update' | 'delete';

/**
 * Recursively marks a value and all nested values as readonly.
 * Useful for ensuring that store snapshots cannot be mutated externally.
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/**
 * Describes a single change applied to an entity in the store.
 * Includes the kind of change, the affected entity, and optionally the prior state.
 */
export type ItemChange<T extends Entity> = {
  type: ChangeType;
  id: string;
  entity: DeepReadonly<T>;
  oldEntity?: DeepReadonly<T>;
};

/**
 * Callback signature for subscribers that want to react to entity changes.
 * Receives an immutable snapshot describing what changed in the store.
 */
export type ChangeHandler<T extends Entity> = (change: ItemChange<T>) => void;
