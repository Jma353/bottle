/**
 * Throws an error with the given message. Useful for exhaustive switch cases
 * when TypeScript narrows a value to `never`.
 */
export function neverReached(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${String(value)}`);
}
