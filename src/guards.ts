import type {
  PeriodLike,
  IPeriod,
  IPeriodSeq,
  IEmptyPeriod,
  PeriodTypeGuard
} from './types';

/** True if value is a single `Period`. */
export const isPeriod: PeriodTypeGuard<IPeriod> = (value: PeriodLike): value is IPeriod => {
  return value.kind === 'Period';
};

/** True if value is a `PeriodSeq`. */
export const isPeriodSeq: PeriodTypeGuard<IPeriodSeq> = (value: PeriodLike): value is IPeriodSeq => {
  return value.kind === 'PeriodSeq';
};

/** True if value is the empty period. */
export const isEmpty: PeriodTypeGuard<IEmptyPeriod> = (value: PeriodLike): value is IEmptyPeriod => {
  return value.kind === 'empty';
};


// Utility function for assertions. The message is a function, since it is often costly to build,
// so that it is only built when the assertion fails.
export function assert(condition: boolean, message: () => string): asserts condition {
  if (!condition) {
    throw new PeriodzError(message());
  }
}

/** The error thrown by periodz, e.g. when a period starts after it ends or values of different types are compared. */
export class PeriodzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PeriodzError';
  }
}
