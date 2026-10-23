import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';

import type { DayjsLike, IPeriod, PeriodLike} from './index.js';
import { Period, PeriodSeq, Comparable, isPeriod, isEmpty } from './index.js';
import { PeriodzError } from './guards.js';
import { Version } from './testHelpers.js';

// Helper function for comparing periods
const periodEqualsPeriod = (p1: IPeriod, p2: IPeriod): void => {
  expect(p1._getStart().source).toEqual(p2._getStart().source);
  expect(p1._getEnd().source).toEqual(p2._getEnd().source);
  expect(p1.subjects).toEqual(p2.subjects);
  expect(p1.isEmpty()).toBe(false);
};

const periodEq = (p1: PeriodLike, p2: PeriodLike): void => {
  if (isEmpty(p1)) {
    expect(isEmpty(p2)).toBe(true);
  } else {
    const periods = p1.periods();
    const otherPeriods = p2.periods();
    expect(periods.length).toBe(otherPeriods.length);
    periods.every((period, idx) => {
      const otherPeriod = otherPeriods[idx];
      periodEqualsPeriod(period, otherPeriod!);
    });
  }
};

describe('Error Handling', () => {
  describe('IComparable errors', () => {

    it('should throw error for undefined source', () => {
      expect(() => Comparable(undefined as any)).toThrow(PeriodzError);
      expect(() => Comparable(undefined as any)).toThrow('no source argument');
    });

    it('should throw error for null source', () => {
      expect(() => Comparable(null as any)).toThrow(PeriodzError);
      expect(() => Comparable(null as any)).toThrow('no source argument');
    });

    it('should throw error for unsupported types', () => {
      expect(() => Comparable('string' as any)).toThrow(PeriodzError);
      expect(() => Comparable('not-comparable' as any)).toThrow(`Comparable: Unsupported source of type: string`);
      expect(() => Comparable({} as any)).toThrow(PeriodzError);
      expect(() => Comparable([] as any)).toThrow(PeriodzError);
    });

  });

  describe('Period errors', () => {
    it('should throw error when start > end', () => {
      expect(() => Period(20, 10)).toThrow(PeriodzError);
      expect(() => Period(20, 10)).toThrow('start(20) must not be > end(10)');
    });

    it('should name the error PeriodzError', () => {
      expect(() => Period(20, 10)).toThrow(expect.objectContaining({ name: 'PeriodzError' }));
    });

    it('should throw error for different types of start & end', () => {
      expect(() => Period(10, new Date('2023-12-31')))
          .toThrow('Cannot handle mixed types; Number and non-Number objects');
    });

    it('should throw error for custom comparable and built-in types', () => {
      const period = Period(Version(1), Version(5));

      expect(() => Period(Version(1), 2)).toThrow('Cannot handle mixed types; custom and non-custom objects');
      expect(() => period.overlaps(Period(2, 3))).toThrow('Cannot handle mixed types; custom and non-custom objects');
      expect(() => period.existsAt(3)).toThrow('Cannot handle mixed types; custom and non-custom objects');
      expect(() => Period(2, 3).union(period)).toThrow(PeriodzError);
    });

    it('should throw error for a custom compareTo() that returns NaN', () => {
      const broken = { compareTo: () => NaN, diff: () => NaN };
      expect(() => Period(broken, { ...broken })).toThrow('must be valid values');
    });

    it('should throw error for invalid date ranges', () => {
      const laterDate = new Date('2023-12-31');
      const earlierDate = new Date('2023-01-01');
      
      expect(() => Period(laterDate, earlierDate)).toThrow(PeriodzError);
    });

    it('should throw error for invalid dayjs ranges', () => {
      const laterDayjs = dayjs('2023-12-31') as unknown as DayjsLike;
      const earlierDayjs = dayjs('2023-01-01') as unknown as DayjsLike;
      
      expect(() => Period(laterDayjs, earlierDayjs)).toThrow(PeriodzError);
    });

    it('should throw error for invalid values', () => {
      expect(() => Period(new Date('invalid'), new Date('2023-12-31'))).toThrow(PeriodzError);
      expect(() => Period(new Date('invalid'), new Date('2023-12-31')))
          .toThrow(/^Period: start\(Invalid Date\) and end\(.+\) must be valid values$/);
      expect(() => Period(dayjs('invalid') as unknown as DayjsLike, dayjs('2023-12-31') as unknown as DayjsLike))
          .toThrow(PeriodzError);
      expect(() => Period(NaN, 10)).toThrow('Period: start(NaN) and end(10) must be valid values');
      expect(() => Period(10, NaN)).toThrow('Period: start(10) and end(NaN) must be valid values');
    });

    it('should only build the error message when the validation fails', () => {
      const toISOString = vi.spyOn(Date.prototype, 'toISOString');
      try {
        Period(new Date('2023-01-01'), new Date('2023-12-31'));
        expect(toISOString).not.toHaveBeenCalled();
      } finally {
        toISOString.mockRestore();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle zero-length periods (start === end)', () => {
      const period = Period(10, 10);
      expect(period.isEmpty()).toBe(true);
    });

    it('should handle very small periods', () => {
      const period = Period(0, 0.000001);
      expect(period.isEmpty()).toBe(false);
    });

    it('should handle negative number ranges', () => {
      const period = Period(-100, -50);
      expect(period.isEmpty()).toBe(false);
      if (!period.isEmpty() && isPeriod(period)) {
        periodEq(period, Period(-100, -50));
      }
    });

    it('should handle very large numbers', () => {
      const period = Period(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER);
      expect(period.isEmpty()).toBe(false);
    });

    it('should handle floating point precision', () => {
      const period = Period(0.1 + 0.2, 0.4); // 0.30000000000000004 vs 0.4
      expect(period.isEmpty()).toBe(false);
    });

    it('should handle invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      expect(() => Period(invalidDate, new Date())).toThrow();
    });

    it('should handle dayjs mixed type comparisons', () => {
      const dayjsPeriod = Period(dayjs('2019-01-01') as unknown as DayjsLike,
          dayjs('2019-01-02') as unknown as DayjsLike);
      const numberPeriod = Period(10, 20);

      // This should throw when trying to compare dayjs with number
      expect(() => {
        dayjsPeriod.union(numberPeriod);
      }).toThrow('Cannot handle mixed types; Dayjs and non-Dayjs objects');
    });

    it('should handle invalid date comparisons', () => {
      const validDate = new Date('2019-01-01');
      const invalidDate = new Date('invalid');

      expect(() => {
        Period(validDate, invalidDate);
      }).toThrow();
    });

    it('should handle error for different types', () => {
      const period = Period(10, 20);
      const datePeriod = Period(new Date('2023-12-30'), new Date('2023-12-31'));

      expect(() => datePeriod.eq(period)).toThrow('Cannot handle mixed types; Date and non-Date objects');
      expect(() => period.eq(datePeriod)).toThrow('Cannot handle mixed types; Number and non-Number objects');
    });

    it('should handle dayjs timezone differences', () => {
      const utcDayjs = dayjs('2023-01-01T12:00:00Z') as unknown as DayjsLike;
      const localDayjs = dayjs('2023-01-01T14:00:00') as unknown as DayjsLike; // 2 hours later to ensure different times
      
      const period = Period(utcDayjs, localDayjs);
      expect(period.isEmpty()).toBe(false);
    });
  });

  describe('PeriodSeq edge cases', () => {
    it('should handle empty array', () => {
      const seq = PeriodSeq([]);
      expect(seq.isEmpty()).toBe(true);
    });

    it('should filter out empty periods', () => {
      const emptyPeriod = Period(10, 10);
      const validPeriod = Period(20, 30);
      const seq = PeriodSeq([emptyPeriod, validPeriod]);
      
      expect(seq.periods().length).toBe(1);
      expect(seq.periods()[0]!.eq(validPeriod)).toBe(true);
    });

    it('should handle all empty periods', () => {
      const seq = PeriodSeq([Period(10, 10), Period(20, 20)]);
      expect(seq.isEmpty()).toBe(true);
    });

    it('should throw error when trying to input overlapping periods', () => {
      const createFn = () => PeriodSeq([Period(10, 20), Period(19, 25)]);
      expect(createFn).toThrow(PeriodzError);
      expect(createFn).toThrow('PeriodSeq is not designed to work with overlapping periods: (19, 25) overlaps (10, 20)');
    });

    it('should find overlapping periods in any order', () => {
      expect(() => PeriodSeq([Period(4, 5), Period(1, 10), Period(2, 3)]))
          .toThrow('PeriodSeq is not designed to work with overlapping periods: (2, 3) overlaps (1, 10)');

      // Touching periods do not overlap
      expect(PeriodSeq([Period(20, 30), Period(10, 20)]).periods().length).toBe(2);
    });
  });

  describe('Type safety', () => {
    it('should maintain type information through operations', () => {
      const period = Period(10, 20);
      const result = period.union(Period(15, 25));
      
      // TypeScript should infer the correct type
      expect(typeof result.isEmpty).toBe('function');
      expect(typeof result.periods).toBe('function');
    });

    it('should handle mixed operations safely', () => {
      const period = Period(10, 20);
      const seq = PeriodSeq([Period(30, 40), Period(50, 60)]);
      
      const result = period.union(seq);
      expect(result.isEmpty()).toBe(false);
      expect(result.periods().length).toBe(3);
    });
  });
});