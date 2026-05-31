import type { Entity, ItemChange } from '../types';

/**
 * Folds a new change into a previous change to produce a single coherent change.
 */
export function foldChange<T extends Entity>(args: {
  previousChange: ItemChange<T>;
  change: ItemChange<T>;
}): ItemChange<T> {
  const { previousChange, change } = args;
  const originalEntity = previousChange.oldEntity;

  if (change.type === 'delete') {
    return {
      type: 'delete',
      id: change.id,
      entity: change.entity,
      oldEntity: originalEntity,
    };
  }

  if (previousChange.type === 'create') {
    return {
      type: 'create',
      id: change.id,
      entity: change.entity,
    };
  }

  if (previousChange.type === 'delete') {
    return {
      type: originalEntity ? 'update' : 'create',
      id: change.id,
      entity: change.entity,
      oldEntity: originalEntity,
    };
  }

  return {
    type: 'update',
    id: change.id,
    entity: change.entity,
    oldEntity: originalEntity,
  };
}
