// Export types
export type {
  ComparableValue,
  CustomComparable,
  DayjsLike,
  IEmptyPeriod,
  IPeriod,
  IPeriodSeq,
  PeriodLike,
  PeriodSubject,
  PropsMerger,
  PeriodTypeGuard,
} from './types';

// Export factories and singleton
export { Comparable } from './Comparable';
export { Period, theEmptyPeriod } from './Period';
export { PeriodSeq } from './PeriodSeq';

// Export type guards
export {
  isPeriod,
  isPeriodSeq,
  isEmpty,
} from './guards';

// Export error class
export { PeriodzError } from './guards';

