import { describe, expect, it } from '@rstest/core';

import { foldChange } from './foldChange';

describe('foldChange', () => {
  it('folds a delete over any previous change', () => {
    const previousChange = {
      type: 'create' as const,
      id: 'one',
      entity: { id: 'one', name: 'Original' },
    };
    const change = {
      type: 'delete' as const,
      id: 'one',
      entity: { id: 'one', name: 'Original' },
      oldEntity: { id: 'one', name: 'Original' },
    };

    const result = foldChange({ previousChange, change });

    expect(result).toEqual({
      type: 'delete',
      id: 'one',
      entity: { id: 'one', name: 'Original' },
      oldEntity: undefined,
    });
  });

  it('folds an update over an insert into an insert', () => {
    const previousChange = {
      type: 'create' as const,
      id: 'one',
      entity: { id: 'one', name: 'Original' },
    };
    const change = {
      type: 'update' as const,
      id: 'one',
      entity: { id: 'one', name: 'Updated' },
      oldEntity: { id: 'one', name: 'Original' },
    };

    const result = foldChange({ previousChange, change });

    expect(result).toEqual({
      type: 'create',
      id: 'one',
      entity: { id: 'one', name: 'Updated' },
    });
  });

  it('folds an update over a delete into an update when original exists', () => {
    const previousChange = {
      type: 'delete' as const,
      id: 'one',
      entity: { id: 'one', name: 'Deleted' },
      oldEntity: { id: 'one', name: 'Original' },
    };
    const change = {
      type: 'update' as const,
      id: 'one',
      entity: { id: 'one', name: 'Resurrected' },
      oldEntity: { id: 'one', name: 'Deleted' },
    };

    const result = foldChange({ previousChange, change });

    expect(result).toEqual({
      type: 'update',
      id: 'one',
      entity: { id: 'one', name: 'Resurrected' },
      oldEntity: { id: 'one', name: 'Original' },
    });
  });

  it('folds an update over a delete into an insert when no original exists', () => {
    const previousChange = {
      type: 'delete' as const,
      id: 'one',
      entity: { id: 'one', name: 'Deleted' },
    };
    const change = {
      type: 'update' as const,
      id: 'one',
      entity: { id: 'one', name: 'Resurrected' },
      oldEntity: { id: 'one', name: 'Deleted' },
    };

    const result = foldChange({ previousChange, change });

    expect(result).toEqual({
      type: 'create',
      id: 'one',
      entity: { id: 'one', name: 'Resurrected' },
      oldEntity: undefined,
    });
  });

  it('folds an update over an update into an update', () => {
    const previousChange = {
      type: 'update' as const,
      id: 'one',
      entity: { id: 'one', name: 'First' },
      oldEntity: { id: 'one', name: 'Original' },
    };
    const change = {
      type: 'update' as const,
      id: 'one',
      entity: { id: 'one', name: 'Second' },
      oldEntity: { id: 'one', name: 'First' },
    };

    const result = foldChange({ previousChange, change });

    expect(result).toEqual({
      type: 'update',
      id: 'one',
      entity: { id: 'one', name: 'Second' },
      oldEntity: { id: 'one', name: 'Original' },
    });
  });
});
