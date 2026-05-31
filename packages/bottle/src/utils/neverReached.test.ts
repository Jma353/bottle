import { describe, expect, it } from '@rstest/core';

import { neverReached } from './neverReached';

describe('neverReached', () => {
  it('throws with a custom message when provided', () => {
    expect(() => {
      neverReached('foo' as never, 'custom error');
    }).toThrow('custom error');
  });

  it('throws with the value in the message when no custom message is given', () => {
    expect(() => {
      neverReached('foo' as never);
    }).toThrow('Unexpected value: foo');
  });
});
