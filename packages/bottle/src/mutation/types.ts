/**
 * Represents the lifecycle stages of a mutation operation.
 * Tracks whether a change is still being edited, in flight, or finalized.
 */
export type MutationStatus = 'draft' | 'pending' | 'committed';
