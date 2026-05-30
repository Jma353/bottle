import { describe, expect, it } from '@rstest/core';

import { deepFreeze } from './deepFreeze';

describe('deepFreeze', () => {
  it('returns primitives unchanged', () => {
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze('hello')).toBe('hello');
    expect(deepFreeze(true)).toBe(true);
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(undefined)).toBe(undefined);
  });

  it('returns symbols unchanged', () => {
    const sym = Symbol('test');
    expect(deepFreeze(sym)).toBe(sym);
  });

  it('returns bigints unchanged', () => {
    expect(deepFreeze(BigInt(1))).toBe(BigInt(1));
  });

  it('freezes a flat object', () => {
    const obj = { a: 1, b: 'two' };
    const result = deepFreeze(obj);

    expect(result).toBe(obj);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('freezes nested objects recursively', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = deepFreeze(obj);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.a)).toBe(true);
    expect(Object.isFrozen(result.a.b)).toBe(true);
  });

  it('freezes arrays recursively', () => {
    const arr = [{ a: 1 }, { b: 2 }];
    const result = deepFreeze(arr);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
    expect(Object.isFrozen(result[1])).toBe(true);
  });

  it('freezes objects containing arrays', () => {
    const obj = { items: [1, 2, 3] };
    const result = deepFreeze(obj);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.items)).toBe(true);
  });

  it('does not recurse into Map or Set', () => {
    const map = new Map([['a', 1]]);
    const set = new Set([1, 2]);
    const obj = { map, set };
    const result = deepFreeze(obj);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.map)).toBe(true);
    expect(Object.isFrozen(result.set)).toBe(true);
    expect(result.map.get('a')).toBe(1);
    expect(result.set.has(1)).toBe(true);
  });

  it('handles empty objects and arrays', () => {
    expect(Object.isFrozen(deepFreeze({}))).toBe(true);
    expect(Object.isFrozen(deepFreeze([]))).toBe(true);
  });

  it('re-freezes an already frozen object without error', () => {
    const obj = Object.freeze({ a: 1 });
    expect(() => deepFreeze(obj)).not.toThrow();
    expect(deepFreeze(obj)).toBe(obj);
  });
});
