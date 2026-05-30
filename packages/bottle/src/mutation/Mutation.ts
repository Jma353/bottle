import { observable, action, makeObservable } from 'mobx';

import type { Entity, ItemChange } from '../types';

import type { MutationStatus } from './types';

type ExecuteFunction<T extends Entity> = (
  change: ItemChange<T>,
) => Promise<void>;

export class Mutation<T extends Entity> {
  id: string = crypto.randomUUID();
  status: MutationStatus = 'draft';
  error?: Error;
  result?: unknown;
  private rolledBack = false;

  public change: ItemChange<T>;
  private readonly rollbackChange: () => void;
  private readonly onSettled: () => void;
  private readonly onChanged: () => void;
  private readonly defaultExecute?: ExecuteFunction<T>;

  constructor(args: {
    change: ItemChange<T>;
    rollbackChange: () => void;
    onChanged?: () => void;
    onSettled?: () => void;
    defaultExecute?: ExecuteFunction<T>;
  }) {
    const { change, rollbackChange, onChanged, onSettled, defaultExecute } =
      args;
    this.change = change;
    this.rollbackChange = rollbackChange;
    this.onChanged = onChanged ?? (() => {});
    this.onSettled = onSettled ?? (() => {});
    this.defaultExecute = defaultExecute;

    makeObservable(this, {
      id: observable,
      status: observable,
      error: observable,
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
    this.onChanged();
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
    if (this.rolledBack) {
      throw new Error('Cannot mark a rolled-back mutation pending');
    }
    if (this.status !== 'draft') {
      throw new Error(
        `Cannot mark mutation pending in status '${this.status}'`,
      );
    }

    this.error = undefined;
    this.status = 'pending';
    this.onChanged();
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
    this.onChanged();
    this.onSettled();
  }

  /**
   * Executes the mutation's commit logic, transitioning through pending to committed.
   */
  async commit(executor?: ExecuteFunction<T>): Promise<void> {
    if (this.rolledBack) {
      throw new Error('Cannot commit a rolled-back mutation');
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
      this.error = err instanceof Error ? err : new Error(String(err));
      this.onChanged();
      throw this.error;
    }
  }
}
