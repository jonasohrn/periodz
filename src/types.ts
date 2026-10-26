
/** A value that a period can start and end at. Start and end must be of the same type. */
export type ComparableValue = number | Date | DayjsLike | CustomComparable;

/** Metadata carried by a period, such as the employee or status it belongs to. */
export type PeriodSubject = unknown;

// Comparison result type
export type ComparisonResult = -1 | 0 | 1;

/** The operations shared by the empty period, `Period` and `PeriodSeq`. Periods are closed, so they include their start and end. */
export interface PeriodCollection {
  /** True for the empty period. */
  readonly isEmpty: () => boolean;
  /** The periods, sorted by start. None for the empty period. */
  readonly periods: () => readonly IPeriod[];
  /** The total length of the periods, as given by the `diff()` of their values, e.g. milliseconds for Dates. */
  readonly length: () => number;
  /** True if this and other share more than a single point. Periods that only touch don't overlap. */
  readonly overlaps: (other: PeriodLike) => boolean;
  /** True if position is in one of the periods, including their start and end. */
  readonly existsAt: (position: ComparableValue) => boolean;
  /** The parts covered by both this and other, with the subjects of both. */
  readonly intersection: (other: PeriodLike) => PeriodLike;
  /** The parts covered by this or other. Overlapping and touching periods merge into one, with the subjects of both. */
  readonly union: (other: PeriodLike) => PeriodLike;
  /** The parts of this that other doesn't cover, with the subjects of this. Shared boundary points are kept. */
  readonly subtract: (other: PeriodLike) => PeriodLike;
  /** True if this and other have the same periods. Subjects are not compared, and touching periods don't equal the period they span. */
  readonly eq: (other: PeriodLike) => boolean;
  /**
   * The parts covered by this or other, split at every start and end, each with the subjects of the periods covering it.
   * Mixing two overlapping periods a and b:
   * |  a  |      ->  | a |a,b| b |     result: A 3-period PeriodSeq where the 2nd has both subjects [a,b]
   *    |  b  |
   */
  readonly mix: (other: PeriodLike) => PeriodLike;
  /**
   * The period from the first start to the last end, so that it also covers the gaps between the periods.
   * It has no subjects or props, since no period covers the gaps, and so neither do the gaps, `span().subtract(this)`.
   */
  readonly span: () => IPeriod | IEmptyPeriod;
  /** True if this covers all of other. Touching periods cover together, and the empty period is never contained. */
  readonly contains: (other: PeriodLike) => boolean;
  /** True if a period of this ends where a period of other starts, or the other way around. */
  readonly touches: (other: PeriodLike) => boolean;
  /** E.g. `Period(10, 20)` or `Seq[Period(10, 20), Period(30, 40)]`. */
  readonly toString: () => string;
  /** E.g. `(10, 20)` or `[(10, 20), (30, 40)]`. */
  readonly toCompactString: () => string;
}

/** A single period from start to end, created by `Period()`. */
export interface IPeriod extends PeriodCollection {
  readonly kind: 'Period';
  /** The start, as given to `Period()`. */
  readonly start: ComparableValue;
  /** The end, as given to `Period()`. */
  readonly end: ComparableValue;
  /** The subjects of the period. */
  readonly subjects: readonly PeriodSubject[];
  /**
   * Not part of the public API and may change in any release. Use `start` instead.
   * @internal
   */
  readonly _getStart: () => IComp;
  /**
   * Not part of the public API and may change in any release. Use `end` instead.
   * @internal
   */
  readonly _getEnd: () => IComp;
}

/** A sequence of two or more non-overlapping periods, sorted by start, created by `PeriodSeq()`. */
export interface IPeriodSeq extends PeriodCollection {
  readonly kind: 'PeriodSeq';
  /** The periods that position is in, including their start and end. */
  readonly periodsAt: (position: ComparableValue) => readonly IPeriod[];
}

/** The empty period, `theEmptyPeriod`. */
export interface IEmptyPeriod extends PeriodCollection {
  readonly kind: 'empty';
}

/**
 * The empty period, a single `Period` or a `PeriodSeq`. Every operation takes and returns a `PeriodLike`,
 * whose kind follows from its number of periods: none, one, or two or more.
 */
export type PeriodLike = IPeriod | IPeriodSeq | IEmptyPeriod;

// IComparable interface
export interface IComparable<T extends ComparableValue> {
  readonly kind: 'Comparable';
  readonly source: T;
  readonly compareTo: (other: IComp) => ComparisonResult;
  readonly eq: (other: IComp) => boolean;
  readonly lt: (other: IComp) => boolean;
  readonly lte: (other: IComp) => boolean;
  readonly gt: (other: IComp) => boolean;
  readonly gte: (other: IComp) => boolean;
  readonly min: (other: IComp) => IComp;
  readonly max: (other: IComp) => IComp;
  readonly diff: (other: IComp) => number;
  readonly toString: () => string;
}

// Shorthand for this long name type
export type IComp = IComparable<ComparableValue>;

/** The parts of a Day.js object that periodz uses, so that periodz doesn't depend on Day.js. */
export interface DayjsLike {
  diff: (a: DayjsLike) => number;
  format: (fmt: string) => string;
}

/**
 * Any object with compareTo() and diff() methods, like Java's Comparable. Only compared with other custom objects.
 * The parameters are never, so that methods and functions with any parameter type are accepted.
 */
export interface CustomComparable {
  /** Negative, zero or positive when this is before, at or after other. */
  compareTo(other: never): number;
  /** The distance from other to this, used by length(). */
  diff(other: never): number;
}

// Function types for lookup tables
export type CompareFn = (source: ComparableValue, other: IComp) => ComparisonResult;
export type DifferenceFn = (source: ComparableValue, other: IComp) => number;

/**
 * Returns props to add to a period. It is called with a new period itself, or for an operation result, with the
 * periods the result comes from. otherPeriod is undefined for a new period and for subtract(). subjects are those
 * of the period that gets the props, which for an operation result are the merged subjects of sourcePeriod and
 * otherPeriod.
 */
export type PropsMerger<T = unknown> = (
  sourcePeriod: IPeriod,
  otherPeriod: IPeriod | undefined,
  subjects: readonly PeriodSubject[]
) => T;

/** A function that tells which kind of `PeriodLike` a value is. */
export type PeriodTypeGuard<T extends PeriodLike> = (value: PeriodLike) => value is T;
