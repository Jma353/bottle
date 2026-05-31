import { observable, action, makeObservable } from 'mobx';

import type { Entity, ItemChange } from '../types';

import type { MutationStatus } from './types';

type ExecuteFunction<T extends Entity> = (
  change: ItemChange<T>,
) => Promise<void>;

export class Mutation<T extends Entity> {
  /**
   * Unique identifier for the mutation.
   */
  id: string;

  /**
   * Current lifecycle status of the mutation.
   */
  status: MutationStatus = 'draft';

  /**
   * Optional result returned from successfully committing the mutation.
   */
  result?: unknown;

  /**
   * Whether the mutation has been rolled back.
   */
  private rolledBack = false;

  public change: ItemChange<T>;

  /**
   * Reverts the mutation's change from the collection when called.
   */
  private readonly rollbackChange: () => void;

  /**
   * Called when the mutation reaches a terminal status (committed, rolled back, or failed).
   */
  private readonly onSettled: () => void;

  /**
   * Called when the mutation's commit fails.
   */
  private readonly onError?: (error: Error) => void;

  /**
   * Default executor used to commit the mutation when no override is provided.
   */
  private readonly defaultExecute?: ExecuteFunction<T>;

  constructor(args: {
    change: ItemChange<T>;
    rollbackChange: () => void;
    onSettled?: () => void;
    onError?: (error: Error) => void;
    defaultExecute?: ExecuteFunction<T>;
    // Used when restoring a mutation from storage
    id?: string;
  }) {
    const { change, rollbackChange, onSettled, onError, defaultExecute, id } =
      args;

    this.id = id ?? crypto.randomUUID();
    this.change = change;
    this.rollbackChange = rollbackChange;
    this.onSettled = onSettled ?? (() => {});
    this.onError = onError;
    this.defaultExecute = defaultExecute;

    makeObservable(this, {
      id: observable,
      status: observable,
      result: observable,
      change: observable.ref,
      markPending: action.bound,
      markCommitted: action.bound,
      commit: action.bound,
      rollback: action.bound,
      updateChange: action.bound,
    });
  }

  /**
   * Updates the mutation's underlying change while it is still in draft status.
   */
  updateChange(args: { change: ItemChange<T> }): void {
    const { change } = args;
    if (this.status !== 'draft') {
      throw new Error(`Cannot update mutation in status '${this.status}'`);
    }
    this.change = change;
  }

  /**
   * Rolls back the mutation, reverting its change from the collection.
   */
  rollback(): void {
    if (this.rolledBack) {
      return;
    }
    if (this.status === 'committed') {
      throw new Error('Cannot rollback a committed mutation');
    }

    this.rollbackChange();
    this.onSettled();
    this.rolledBack = true;
  }

  /**
   * Transitions the mutation to pending status.
   */
  markPending(): void {
    if (this.rolledBack || this.status === 'committed') {
      throw new Error('Cannot mark a settled mutation pending');
    }
    if (this.status !== 'draft') {
      throw new Error(
        `Cannot mark mutation pending in status '${this.status}'`,
      );
    }

    this.status = 'pending';
  }

  /**
   * Transitions the mutation to committed status with an optional result.
   */
  markCommitted(args: { result?: unknown } = {}): void {
    const { result } = args;
    if (this.status !== 'pending') {
      throw new Error(
        `Cannot mark mutation committed in status '${this.status}'`,
      );
    }

    this.result = result;
    this.status = 'committed';
    this.onSettled();
  }

  /**
   * Executes the mutation's commit logic, transitioning through pending to committed.
   */
  async commit(executor?: ExecuteFunction<T>): Promise<void> {
    if (this.rolledBack) {
      throw new Error('Cannot commit a rolled-back mutation');
    }
    if (this.status === 'committed') {
      throw new Error('Cannot commit a settled mutation');
    }
    if (this.status !== 'draft') {
      throw new Error(`Cannot commit mutation in status '${this.status}'`);
    }

    this.markPending();

    const actualExecutor = executor ?? this.defaultExecute;

    if (!actualExecutor) {
      this.markCommitted();
      return;
    }

    try {
      await actualExecutor(this.change);
      this.markCommitted();
    } catch (err) {
      this.status = 'draft';
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
      this.onSettled();
      throw error;
    }
  }
}
