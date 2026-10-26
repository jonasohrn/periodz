import type {
  ComparableValue,
  IComp,
  IPeriod,
  IEmptyPeriod,
  PeriodSubject,
  PropsMerger,
  PeriodLike
} from './types';

import { Comparable } from './Comparable';
import { createPeriodSeq, PeriodSeq } from './PeriodSeq';
import { isPeriod, assert } from './guards';

// The propsMerger of each period. Kept here so that a period without a propsMerger can use the one of
// the other period in union() and intersection().
const propsMergers = new WeakMap<IPeriod, PropsMerger>();

// Adds the props from a propsMerger to a period, but never replaces any of the period's own members.
// A propsMerger that returns e.g. { ...sourcePeriod } would otherwise replace start, end etc. of the period.
const addProps = (period: IPeriod, props: unknown): void => {
  if (typeof props !== 'object' || props === null) {
    return;
  }
  for (const [key, value] of Object.entries(props)) {
    if (!Object.hasOwn(period, key)) {
      Object.assign(period, { [key]: value });
    }
  }
};

// Internal function to create result periods.
// Creates a period from source, e.g. a part of it, or from source and propsFrom for union() and intersection().
// Its props are merged from both, once, by the propsMerger of source or else by the one of propsFrom,
// which also gets the subjects of the result period.
const resultPeriod = (
    start: IComp,
    end: IComp,
    subjects: readonly PeriodSubject[],
    source: IPeriod,
    propsFrom?: IPeriod // Not for subtract(), which keeps the props of source only
): IPeriod | IEmptyPeriod => {
  const propsMerger = propsMergers.get(source) ?? (propsFrom ? propsMergers.get(propsFrom) : undefined);
  const period = createPeriod(start, end, subjects, propsMerger);

  // Only periods with a configured merger get props
  if (propsMerger && isPeriod(period)) {
    addProps(period, propsMerger(source, propsFrom, subjects));
  }

  return period;
};

// The period from the first start to the last end of two periods, with the subjects and props of both,
// those of period first. This is the union() of two overlapping or touching periods.
export const spanningPeriod = (period: IPeriod, other: IPeriod): IPeriod => {
  return resultPeriod(
      period._getStart().min(other._getStart()),
      period._getEnd().max(other._getEnd()),
      [...period.subjects, ...other.subjects],
      period,
      other
  ) as IPeriod; // Never empty, since neither period is
};

// The period from the start of first to the end of last, without subjects or props. This is span(), which
// also covers the gaps between periods, and no period covers those.
export const spanBetween = (first: IPeriod, last: IPeriod): IPeriod => {
  return createPeriod(first._getStart(), last._getEnd(), []) as IPeriod; // Never empty, since first is not
};

const createPeriod = (
    start: IComp,
    end: IComp,
    subjects: readonly PeriodSubject[],
    propsMerger?: PropsMerger
): IPeriod | IEmptyPeriod => {
  const order = start.compareTo(end); // This will check that start and end is of same type
  // NaN for e.g. invalid Dates, which would otherwise make all comparisons false
  assert(!Number.isNaN(order), () => `Period: start(${String(start.source)}) and end(${String(end.source)}) must be valid values`);
  assert(order <= 0, () => `Period: start(${start.toString()}) must not be > end(${end.toString()})`);

  if (order === 0) {
    return theEmptyPeriod;
  }

  const self: IPeriod = {
    kind: 'Period' as const,

    start: start.source,
    end: end.source,

    subjects: Object.freeze(subjects),

    // Internal methods - not for external use
    _getStart(): typeof start {
      return start;
    },

    _getEnd(): typeof end {
      return end;
    },

    periods(): readonly IPeriod[] {
      // A new array every time is faster than a cached one, frozen or not, since this is called in the inner
      // loops of the PeriodSeq operations. A cached array made subtract() and mix() ~2x slower for 4000 periods.
      return [self];
    },

    length(): number {
      return end.diff(start);
    },

    overlaps(other: PeriodLike): boolean {
      // Stryker disable next-line all: Performance optimization - empty periods have no overlap
      if (other.isEmpty()) {
        return false;
      }
      return other.periods().some((p) => end.gt(p._getStart()) && start.lt(p._getEnd()));
    },

    touches(other: PeriodLike): boolean {
      // Stryker disable next-line all: Performance optimization - empty periods cannot touch
      if (other.isEmpty()) {
        return false;
      }
      return other.periods().some(otherPeriod =>
        start.eq(otherPeriod._getEnd()) || end.eq(otherPeriod._getStart())
      );
    },

    eq(other: PeriodLike): boolean {
      if (isPeriod(other)) {
        return start.eq(other._getStart()) && end.eq(other._getEnd());
      }
      // A PeriodSeq has two or more periods, and the empty period none
      return false;
    },

    contains(other: PeriodLike): boolean {
      if (other.isEmpty()) {
        return false;
      }
      if (isPeriod(other)) {
        return start.lte(other._getStart()) && end.gte(other._getEnd());
      }
      return other.periods().every(p => self.contains(p));
    },

    existsAt(position: ComparableValue): boolean {
      const comparable = Comparable(position);
      return start.lte(comparable) && end.gte(comparable);
    },

    intersection(other: PeriodLike): PeriodLike {
      if (!self.overlaps(other)) {
        return theEmptyPeriod;
      }

      if (isPeriod(other)) {
        const intersectionStart = start.max(other._getStart());
        const intersectionEnd = end.min(other._getEnd());
        const resultSubjects = [...subjects, ...other.subjects];
        return resultPeriod(intersectionStart, intersectionEnd, resultSubjects, self, other);
      }

      // Not other.intersection(self), which would put the subjects and props of other first
      return PeriodSeq(other.periods().map(otherPeriod => self.intersection(otherPeriod)));
    },

    union(other: PeriodLike): PeriodLike {
      if (other.isEmpty()) {
        return self;
      }

      if (isPeriod(other)) {
        const isMerge = self.overlaps(other) || self.touches(other);
        if (!isMerge) {
          return PeriodSeq([self, other]);
        }
        return spanningPeriod(self, other);
      }

      return createPeriodSeq([self]).union(other);
    },

    subtract(other: PeriodLike): PeriodLike {
      if (!self.overlaps(other)) {
        return self;
      }

      if (isPeriod(other)) {
        if (other.contains(self)) {
          return theEmptyPeriod;
        }

        if (self.contains(other)) {
          const period1 = resultPeriod(start, other._getStart(), subjects, self);
          const period2 = resultPeriod(other._getEnd(), end, subjects, self);
          return PeriodSeq([period1, period2]);
        }

        if (start.lt(other._getStart())) {
          return resultPeriod(start, other._getStart(), subjects, self);
        } else {
          return resultPeriod(other._getEnd(), end, subjects, self);
        }
      }

      let result: PeriodLike = self;
      for (const period of other.periods()) {
        result = result.subtract(period);
      }
      return result;
    },

    mix(other: PeriodLike): PeriodLike {
      // Not left to PeriodSeq.mix(), which would return the PeriodSeq of only this period
      if (other.isEmpty()) {
        return self;
      }
      return createPeriodSeq([self]).mix(other);
    },

    span(): IPeriod {
      return spanBetween(self, self);
    },

    isEmpty(): boolean {
      return false;
    },

    toString(): string {
      return `Period(${start.toString()}, ${end.toString()})`;
    },

    toCompactString(): string {
      return `(${start.toString()}, ${end.toString()})`;
    }
  };

  if (propsMerger) {
    propsMergers.set(self, propsMerger);
  }

  return self;
};

/**
 * Creates a period from start to end, both included, with optional subjects and propsMerger.
 * Returns theEmptyPeriod when start equals end.
 * @throws PeriodzError if start is after end, a value is invalid, such as an invalid Date, or start and end
 * are of different types.
 */
export const Period = (
  startArg: ComparableValue,
  endArg: ComparableValue,
  subjects?: PeriodSubject | readonly PeriodSubject[],
  propsMerger?: PropsMerger
): PeriodLike => {
  // Always a copy, since the period freezes its subjects and must not change when the caller's array does
  const subjectsArray = subjects === undefined ? [] :
                       Array.isArray(subjects) ? [...subjects] : [subjects];

  const start = Comparable(startArg);
  const end = Comparable(endArg);
  const period = createPeriod(start, end, subjectsArray, propsMerger);

  // Apply propsMerger to the main period if provided
  if (propsMerger && isPeriod(period)) {
    addProps(period, propsMerger(period, undefined, period.subjects));
  }

  return period;
};

const noPeriods: readonly IPeriod[] = Object.freeze([]);

/** The empty period. Every empty result is this same object. */
export const theEmptyPeriod: IEmptyPeriod = Object.freeze({
  kind: 'empty' as const,

  periods(): readonly IPeriod[] {
    return noPeriods;
  },

  length(): number {
    return 0;
  },

  overlaps(_other: PeriodLike): boolean {
    return false;
  },

  touches(_other: PeriodLike): boolean {
    return false;
  },

  eq(other: PeriodLike): boolean {
    return other.isEmpty();
  },

  contains(_other: PeriodLike): boolean {
    return false;
  },

  existsAt(_comparable: ComparableValue): boolean {
    return false;
  },

  intersection(_other: PeriodLike): IEmptyPeriod {
    return theEmptyPeriod;
  },

  union(other: PeriodLike): PeriodLike {
    return other;
  },

  subtract(_other: PeriodLike): IEmptyPeriod {
    return theEmptyPeriod;
  },

  mix(other: PeriodLike): PeriodLike {
    return other;
  },

  span(): IEmptyPeriod {
    return theEmptyPeriod;
  },

  isEmpty(): boolean {
    return true;
  },

  toString(): string {
    return 'Period [empty]';
  },

  toCompactString(): string {
    return '[empty]';
  }
});
