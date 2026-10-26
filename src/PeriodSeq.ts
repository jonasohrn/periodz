import type { ComparableValue, IComp, IPeriod, IPeriodSeq, PeriodLike } from './types';
import { spanBetween, spanningPeriod, theEmptyPeriod } from './Period';
import { assert } from './guards';

// Sorting function for periods
const sortFnSeq = (a: IPeriod, b: IPeriod): number => {
  return a._getStart().compareTo(b._getStart());
};

// True if period is defined and ends at or before position, i.e. it can't overlap anything from position on
const endsBy = (period: IPeriod | undefined, position: IComp): boolean => {
  // Stryker disable next-line all: Performance optimization - only used to skip periods that can't overlap
  return period !== undefined && position.gte(period._getEnd());
};

/**
 * Creates a sequence of the periods of the given PeriodLikes, sorted by start. Empty periods are dropped.
 * Like every result, it is of the simplest kind that holds the periods: theEmptyPeriod for none,
 * the Period itself for one and a PeriodSeq for two or more.
 * @throws PeriodzError if any two periods overlap. Touching periods are allowed.
 */
export const PeriodSeq = (periodsArg: readonly PeriodLike[]): PeriodLike => {
  // Filter out empty periods and collect all periods
  const allPeriods: IPeriod[] = [];

  for (const periodLike of periodsArg) {
    // Stryker disable next-line all: Performance optimization - empty periods contribute nothing
    if (!periodLike.isEmpty()) {
      allPeriods.push(...periodLike.periods());
    }
  }

  const periods = allPeriods.sort(sortFnSeq);

  // Check no overlaps exist. The periods are sorted by start, so if any two periods overlap,
  // then so do two neighbours, and it is enough to check each period against the next one.
  periods.forEach((period, index) => {
    const next = periods[index + 1];
    if (next) {
      assert(!next.overlaps(period), () => `PeriodSeq is not designed to work with overlapping periods: ${next.toCompactString()} overlaps ${period.toCompactString()}`);
    }
  });

  if (periods.length > 1) {
    return createPeriodSeq(periods);
  }
  return periods[0] ?? theEmptyPeriod;
};

// Internal function that creates a PeriodSeq of sorted, non-overlapping periods, without checking them.
// Period uses it with only itself for union() and mix(), which build their results through PeriodSeq(),
// so that a PeriodSeq of a single period is never returned.
export const createPeriodSeq = (periodsArg: readonly IPeriod[]): IPeriodSeq => {
  // Frozen once here, so that periods() can return it as is
  const periods = Object.freeze(periodsArg);

  const self: IPeriodSeq = {
    kind: 'PeriodSeq' as const,

    periods(): readonly IPeriod[] {
      return periods;
    },

    length(): number {
      return periods.reduce((sum, period) => sum + period.length(), 0);
    },

    overlaps(other: PeriodLike): boolean {
      return !self.intersection(other).isEmpty();
    },

    periodsAt(position: ComparableValue): readonly IPeriod[] {
      return self.periods().filter(p => p.existsAt(position));
    },

    existsAt(position: ComparableValue): boolean {
      return self.periodsAt(position).length > 0;
    },

    eq(other: PeriodLike): boolean {
      const otherPeriods = other.periods();
      if (periods.length !== otherPeriods.length) {
        return false;
      }

      return periods.every((period, idx) => {
        const otherPeriod = otherPeriods[idx];
        return otherPeriod && period.eq(otherPeriod);
      });
    },

    intersection(other: PeriodLike): PeriodLike {
      // Stryker disable next-line all: Performance optimization - intersection with empty is empty
      if (other.isEmpty()) {
        return theEmptyPeriod;
      }

      const periodsResult: PeriodLike[] = [];
      const otherPeriods = other.periods();
      let first = 0; // The first other period that does not end before the current period starts

      for (const period of periods) {
        // Other periods that end before this period starts can't overlap it, nor any period after it
        // Stryker disable next-line all: Performance optimization
        while (endsBy(otherPeriods[first], period._getStart())) {
          first++;
        }
        for (let k = first; ; k++) {
          const otherPeriod = otherPeriods[k];
          // No other period from the first one that starts when this period ends or later can overlap it
          // Stryker disable next-line all: Performance optimization
          if (otherPeriod === undefined || period._getEnd().lte(otherPeriod._getStart())) {
            break;
          }
          periodsResult.push(period.intersection(otherPeriod));
        }
      }

      return PeriodSeq(periodsResult);
    },

    union(other: PeriodLike): PeriodLike {
      if (other.isEmpty()) {
        return self;
      }

      // Group the periods of self and other into runs of overlapping or touching periods, in order by start
      const runs: { periods: IPeriod[], end: IComp }[] = [];
      for (const period of [...periods, ...other.periods()].sort(sortFnSeq)) {
        const run = runs.at(-1);
        if (run?.end.gte(period._getStart())) {
          run.periods.push(period);
          run.end = run.end.max(period._getEnd());
        } else {
          runs.push({ periods: [period], end: period._getEnd() });
        }
      }

      // Merge each run into one period, with the subjects and props of self first as for union() of two Periods
      const ownPeriods = new Set(periods);
      return PeriodSeq(runs.map(run => [
        ...run.periods.filter(period => ownPeriods.has(period)),
        ...run.periods.filter(period => !ownPeriods.has(period)),
      ].reduce(spanningPeriod)));
    },

    subtract(other: PeriodLike): PeriodLike {
      // Stryker disable next-line all: Performance optimization
      if (other.isEmpty()) {
        return self;
      }

      const periodsResult: IPeriod[] = [];
      const otherPeriods = other.periods();
      let first = 0; // The first other period that does not end before the current period starts

      for (const period of periods) {
        // Other periods that end before this period starts can't overlap it, nor any period after it
        // Stryker disable next-line all: Performance optimization
        while (endsBy(otherPeriods[first], period._getStart())) {
          first++;
        }

        let currentPeriods: readonly IPeriod[] = [period];

        for (let k = first; ; k++) {
          const otherPeriod = otherPeriods[k];
          // No other period from the first one that starts when this period ends or later can overlap it
          // Stryker disable next-line all: Performance optimization
          if (otherPeriod === undefined || period._getEnd().lte(otherPeriod._getStart())) {
            break;
          }
          const nextPeriods: IPeriod[] = [];

          for (const cp of currentPeriods) {
            const subtractResult = cp.subtract(otherPeriod);
            nextPeriods.push(...subtractResult.periods());
          }
          currentPeriods = nextPeriods;
        }
        periodsResult.push(...currentPeriods);
      }

      // Unchanged when other overlaps none of the periods, since Period.subtract() then returns the period itself
      const isUnchanged = periodsResult.length === periods.length
          && periodsResult.every((period, index) => period === periods[index]);
      return isUnchanged ? self : PeriodSeq(periodsResult);
    },

    mix(other: PeriodLike): PeriodLike {
      if (other.isEmpty()) {
        return self;
      }
      const resultPeriods = [
        self.subtract(other),
        other.subtract(self),
        self.intersection(other)
      ];
      return PeriodSeq(resultPeriods);
    },

    span(): IPeriod {
      // The periods are sorted and don't overlap, so the last one ends last. A PeriodSeq has two or more periods.
      return spanBetween(periods[0] as IPeriod, periods.at(-1) as IPeriod);
    },

    isEmpty(): boolean {
      return false;
    },

    contains(other: PeriodLike): boolean {
      // Never contains the empty period
      if (other.isEmpty()) {
        return false;
      }

      // Touching periods cover together, so each period of other must be covered by periods without gaps between
      return other.periods().every(otherPeriod => {
        let coveredTo = otherPeriod._getStart();
        for (const period of periods) {
          if (period._getStart().gt(coveredTo)) {
            break; // A gap
          }
          coveredTo = coveredTo.max(period._getEnd());
        }
        return coveredTo.gte(otherPeriod._getEnd());
      });
    },

    touches(other: PeriodLike): boolean {
      return other.periods().some(otherPeriod =>
          periods.some(period => period.touches(otherPeriod))
      );
    },

    toString(): string {
      return `Seq[${periods.map(p => p.toString()).join(', ')}]`;
    },

    toCompactString(): string {
      return `[${periods.map(p => p.toCompactString()).join(', ')}]`;
    }
  };

  return Object.freeze(self);
};
