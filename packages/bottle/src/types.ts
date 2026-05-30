export type Entity = {
  id: string;
};

export type ChangeType = 'insert' | 'update' | 'delete';

export type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type ItemChange<T extends Entity> = {
  type: ChangeType;
  id: string;
  entity: DeepReadonly<T>;
  oldEntity?: DeepReadonly<T>;
};

export type ChangeHandler<T extends Entity> = (change: ItemChange<T>) => void;
