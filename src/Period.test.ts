import { describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import type { IPeriod, PropsMerger } from './index.js';
import {
  isPeriod,
  isPeriodSeq,
  Period,
  PeriodSeq,
  theEmptyPeriod,
} from './index.js';
import { periodEq, Rank, testPeriod, testPeriodDayjs, Version } from './testHelpers.js';

// Block order (same in PeriodSeq.test.ts):
//   factory, propsMerger, accessors, predicates, set operations, toString, internal API.
// Case order within a block:
//   with Period, with PeriodSeq, with empty period, special cases, subjects, propsMerger.

describe('Period', () => {

  // Period(x, x) always yields the singleton theEmptyPeriod
  const empty = Period(10, 10);

  describe('factory', () => {
    it('exposes start and end', () => {
      const period = testPeriod(10, 20);
      expect(period.start).toBe(10);
      expect(period.end).toBe(20);
    });

    it('normalizes subjects to an array', () => {
      let period = testPeriod(10, 20);
      expect(period.subjects).toEqual([]);

      period = testPeriod(10, 20, "subject1");
      expect(period.subjects).toEqual(["subject1"]);

      period = testPeriod(10, 20, ["subject1"]);
      expect(period.subjects).toEqual(["subject1"]);

      period = testPeriod(10, 20, [[1,2,3], 2, "subj3"]);
      expect(period.subjects).toEqual([[1,2,3], 2, "subj3"]);
    });

    it('copies the subjects array instead of freezing it', () => {
      const subjects = ['subject1'];
      const period = testPeriod(10, 20, subjects);

      subjects.push('subject2');
      expect(Object.isFrozen(subjects)).toBe(false);
      expect(period.subjects).toEqual(['subject1']);
      expect(Object.isFrozen(period.subjects)).toBe(true);
    });

    it('returns theEmptyPeriod when start equals end', () => {
      expect(empty.isEmpty()).toBe(true);
      expect(empty).toBe(theEmptyPeriod);
      expect(empty).toBe(Period(20, 20));
    });

    it('with a custom comparable type', () => {
      const start = Version(1);
      const end = Version(2);
      const period = testPeriod(start, end);

      expect(period.start).toBe(start);
      expect(period.end).toBe(end);
      expect(Period(start, Version(1))).toBe(theEmptyPeriod);
      expect(() => Period(end, start)).toThrow('Period: start(v2) must not be > end(v1)');
      expect(() => Period(Rank(1) as any, Rank(2) as any)).toThrow('Unsupported source');
    });
  });

  // propsMerger is a factory argument that affects several operations.
  // Operation specific propsMerger tests are found in the block of the operation.
  describe('propsMerger', () => {
    it('is called once per period, with self and the other period', () => {
      const propsMerger = vi.fn((_sourcePeriod: IPeriod, _otherPeriod?: IPeriod) => ({}));
      const period1 = Period(10, 30, ['subject1'], propsMerger);
      const period2 = Period(20, 40, ['subject2']);
      expect(propsMerger).toHaveBeenCalledTimes(1);
      expect(propsMerger.mock.calls[0]![0]).toBe(period1);
      expect(propsMerger.mock.calls[0]![1]).toBeUndefined();

      propsMerger.mockClear();
      period1.intersection(period2);
      expect(propsMerger).toHaveBeenCalledTimes(1);
      expect(propsMerger.mock.calls[0]![0]).toBe(period1);
      expect(propsMerger.mock.calls[0]![1]).toBe(period2);

      propsMerger.mockClear();
      period1.subtract(period2);
      expect(propsMerger).toHaveBeenCalledTimes(1);
      expect(propsMerger.mock.calls[0]![0]).toBe(period1);
      expect(propsMerger.mock.calls[0]![1]).toBeUndefined();
    });

    it('gets the subjects of the period that gets the props', () => {
      const propsMerger = (_sourcePeriod: IPeriod, _otherPeriod: IPeriod | undefined, subjects: readonly unknown[]) => ({
        mergedSubjects: subjects
      });
      const period1 = Period(10, 30, ['subject1'], propsMerger) as any;
      const period2 = Period(20, 40, ['subject2']);

      for (const result of [period1, period1.intersection(period2), period1.union(period2), period1.subtract(period2)]) {
        expect(result.mergedSubjects).toBe(result.subjects);
      }
      expect(period1.intersection(period2).mergedSubjects).toEqual(['subject1', 'subject2']);
    });

    it('uses the propsMerger of the other period when self has none', () => {
      const propsMerger = (sourcePeriod: any, otherPeriod?: any) => ({
        count: (sourcePeriod.count ?? 0) + (otherPeriod?.count ?? 0)
      });

      const period1 = Period(10, 30, ['subject1']);
      const period2 = Period(20, 40, ['subject2'], propsMerger);
      Object.assign(period1, { count: 5 });
      Object.assign(period2, { count: 3 });

      const intersection = period1.intersection(period2) as any;
      expect(intersection.count).toBe(8);
      expect((period1.union(period2) as any).count).toBe(8);

      // The result keeps the propsMerger for further operations
      expect((intersection.union(Period(30, 50)) as any).count).toBe(8);

      // subtract() only merges props from self, which has no propsMerger
      expect((period1.subtract(period2) as any).count).toBeUndefined();
    });

    it('never lets props replace the members of the period', () => {
      // Spreads all members of sourcePeriod, including start, end, subjects, _getStart() etc.
      const propsMerger = (sourcePeriod: any) => ({ ...sourcePeriod, extra: 'extra' });

      const period1 = Period(10, 20, ['subject1'], propsMerger);
      const intersection = period1.intersection(Period(15, 25, ['subject2'])) as any;

      expect(intersection.start).toBe(15);
      expect(intersection._getStart().source).toBe(15);
      expect(intersection.subjects).toEqual(['subject1', 'subject2']);
      expect(intersection.toCompactString()).toBe('(15, 20)');
      expect(intersection.extra).toBe('extra');
    });

    it('ignores props that are not objects', () => {
      for (const props of [undefined, null, 'ab']) {
        const period = Period(10, 20, [], () => props) as any;
        expect(period.isEmpty()).toBe(false);
        expect(period[0]).toBeUndefined();
      }
    });
  });

  describe('periods()', () => {
    it('with empty period', () => {
      const periods = empty.periods();
      expect(periods.length).toBe(0);
      expect(empty.periods()).toBe(periods);
      expect(Object.isFrozen(periods)).toBe(true);
    });
  });

  describe('length()', () => {
    it('with number', () => {
      expect(Period(10, 20).length()).toBe(10);
    });

    it('with Date', () => {
      const start = new Date('2024-01-01T10:00:00');
      const end = new Date('2024-01-01T12:00:00');
      const period = Period(start, end);

      expect(period.length()).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
    });

    it('with dayjs', () => {
      const start = dayjs('2024-01-01T10:00:00') as any; // Cast to any for dayjs compatibility
      const end = dayjs('2024-01-01T12:00:00') as any;
      const period = Period(start, end);

      expect(period.length()).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
    });

    it('with a custom comparable type', () => {
      expect(Period(Version(10), Version(25)).length()).toBe(15);
    });

    it('with empty period', () => {
      expect(theEmptyPeriod.length()).toBe(0);
    });

    it('with Date differing by 1ms', () => {
      const date1 = new Date('2019-01-01T00:00:00.000Z');
      const date2 = new Date('2019-01-01T00:00:00.001Z');

      expect(testPeriod(date1, date2).length()).toBe(1);
    });
  });

  describe('eq()', () => {
    const period = Period(10, 20, ['subject']);

    it('with Period', () => {
      expect(period.eq(Period(10, 20))).toBe(true);
    });

    it('with PeriodSeq', () => {
      expect(period.eq(PeriodSeq([Period(10, 20), Period(30, 40)]))).toBe(false);
      // Touching periods are other periods, though they cover the same values
      expect(period.eq(PeriodSeq([Period(10, 15), Period(15, 20)]))).toBe(false);
    });

    it('with empty period', () => {
      expect(period.eq(Period(10, 10))).toBe(false);

      expect(empty.eq(Period(20, 20))).toBe(true);
      expect(empty.eq(Period(5, 15))).toBe(false);
      expect(empty.eq(PeriodSeq([]))).toBe(true);
    });
  });

  describe('overlaps()', () => {
    const period = Period(10, 20);

    it('with Period', () => {
      expect(period.overlaps(Period(10, 20))).toBe(true);
      expect(period.overlaps(Period(9, 21))).toBe(true);
      expect(period.overlaps(Period(20, 30))).toBe(false);
      expect(period.overlaps(Period(0, 10))).toBe(false);
      expect(period.overlaps(Period(5, 11))).toBe(true);
    });

    it('with empty period', () => {
      expect(period.overlaps(Period(5, 5))).toBe(false);

      expect(empty.overlaps(Period(5, 15))).toBe(false);
      expect(empty.overlaps(PeriodSeq([Period(20, 30), Period(40, 50)]))).toBe(false);
      expect(empty.overlaps(empty)).toBe(false);
    });
  });

  describe('touches()', () => {
    const period1 = Period(10, 20);
    const period2 = Period(20, 30);
    const period3 = Period(25, 30);

    it('with Period', () => {
      expect(period1.touches(period2)).toBe(true);
      expect(period2.touches(period1)).toBe(true);
      expect(period2.touches(period3)).toBe(false);
    });

    it('with PeriodSeq', () => {
      const periodSeq = PeriodSeq([Period(20, 21), Period(23, 25)]);

      expect(period1.touches(periodSeq)).toBe(true);
      expect(period2.touches(periodSeq)).toBe(false);
      expect(period3.touches(periodSeq)).toBe(true);

      const period = Period(15, 25);
      expect(period.touches(PeriodSeq([Period(25, 35), Period(40, 50)]))).toBe(true);
      expect(period.touches(PeriodSeq([Period(30, 40), Period(45, 50)]))).toBe(false);
    });

    it('with empty period', () => {
      expect(period2.touches(theEmptyPeriod)).toBe(false);

      expect(empty.touches(Period(5, 15))).toBe(false);
      expect(empty.touches(PeriodSeq([Period(20, 30)]))).toBe(false);
      expect(empty.touches(empty)).toBe(false);
    });
  });

  describe('contains()', () => {
    const period1 = Period(100, 200);

    it('with Period', () => {
      const period2 = Period(100, 150);

      expect(period1.contains(period2)).toBe(true);
      expect(period1.contains(period1)).toBe(true);
      expect(period2.contains(period1)).toBe(false);
    });

    it('with PeriodSeq', () => {
      const periodSeq1 = PeriodSeq([Period(100, 110), Period(150, 300)]);
      expect(period1.contains(periodSeq1)).toBe(false);

      const periodSeq2 = PeriodSeq([Period(100, 110), Period(120, 200)]);
      expect(period1.contains(periodSeq2)).toBe(true);

      const period = Period(10, 50);
      expect(period.contains(PeriodSeq([Period(15, 25), Period(30, 40)]))).toBe(true);
      expect(period.contains(PeriodSeq([Period(15, 25), Period(45, 55)]))).toBe(false);
    });

    it('with empty period', () => {
      // Never contains the empty period
      expect(period1.contains(Period(1, 1))).toBe(false);

      expect(empty.contains(Period(5, 15))).toBe(false);
      expect(empty.contains(PeriodSeq([Period(20, 30)]))).toBe(false);
      expect(empty.contains(empty)).toBe(false);
    });
  });

  describe('existsAt()', () => {
    it('with positions inside, on and outside boundaries', () => {
      const period = Period(10, 20);

      expect(period.existsAt(9.9)).toBe(false);
      expect(period.existsAt(10)).toBe(true);
      expect(period.existsAt(11)).toBe(true);
      expect(period.existsAt(20)).toBe(true);
      expect(period.existsAt(25)).toBe(false);
    });

    it('with empty period', () => {
      expect(empty.existsAt(5)).toBe(false);
      expect(empty.existsAt(10)).toBe(false);
      expect(empty.existsAt(15)).toBe(false);
    });
  });

  describe('intersection()', () => {
    it('with Period', () => {
      let period1 = Period(10, 16);
      let period2 = Period(14, 20);

      const intersection = period1.intersection(period2);
      expect(isPeriod(intersection)).toBeTruthy();
      periodEq(intersection, Period(14, 16));

      period1 = Period(10, 15);
      period2 = Period(11, 12);
      periodEq(period1.intersection(period2), Period(11, 12));

      period1 = Period(-40, -20);
      period2 = Period(-60, 10);
      periodEq(period1.intersection(period2), Period(-40, -20));

      period1 = Period(50, 100);
      period2 = Period(1, 2);
      expect(period1.intersection(period2).isEmpty()).toBe(true);
    });

    it('with PeriodSeq', () => {
      const period1 = Period(10, 20);

      const intersection = period1.intersection(PeriodSeq([Period(10, 11), Period(15, 25)]));
      periodEq(intersection, PeriodSeq([Period(10, 11), Period(15, 20)]));
    });

    it('with empty period', () => {
      expect(empty.intersection(Period(5, 15)).isEmpty()).toBe(true);
      expect(empty.intersection(PeriodSeq([Period(20, 30)])).isEmpty()).toBe(true);
      expect(empty.intersection(empty).isEmpty()).toBe(true);
    });

    it('keeps the custom comparable objects of the inputs', () => {
      const v = [Version(0), Version(1), Version(2), Version(3)] as const;
      const intersection = testPeriod(v[0], v[2]).intersection(Period(v[1], v[3]));

      expect(isPeriod(intersection)).toBe(true);
      expect((intersection as IPeriod).start).toBe(v[1]);
      expect((intersection as IPeriod).end).toBe(v[2]);
    });

    it('returns empty when periods only touch', () => {
      const period1 = Period(10, 20);
      const period2 = Period(20, 30);

      expect(period1.intersection(period2).isEmpty()).toBe(true);
    });

    it('returns Period, PeriodSeq or empty depending on other', () => {
      const period1 = Period(10, 20);

      // result is Period
      let intersection = period1.intersection(Period(15, 25));
      expect(isPeriod(intersection)).toBeTruthy();
      expect(isPeriodSeq(intersection)).toBeFalsy();

      // result is PeriodSeq
      intersection = period1.intersection(PeriodSeq([Period(10, 11), Period(15, 25)]));
      expect(isPeriod(intersection)).toBeFalsy();
      expect(isPeriodSeq(intersection)).toBeTruthy();

      // result is empty
      intersection = period1.intersection(Period(25, 30));
      expect(isPeriod(intersection)).toBeFalsy();
      expect(isPeriodSeq(intersection)).toBeFalsy();
    });

    it('merges subjects', () => {
      // multiple subjects on both sides
      periodEq(
          Period(10, 30, ['subject1', 'subject2']).intersection(Period(20, 40, ['subject3', 'subject4'])),
          Period(20, 30, ['subject1', 'subject2', 'subject3', 'subject4']));

      // single (non-array) subjects
      periodEq(
          Period(10, 20, 'singleSubject').intersection(Period(15, 25, 'anotherSubject')),
          Period(15, 20, ['singleSubject', 'anotherSubject']));

      // empty subjects array on one side
      periodEq(
          Period(10, 20, []).intersection(Period(15, 25, ['subject1'])),
          Period(15, 20, ['subject1']));

      // no subjects at all
      periodEq(
          Period(10, 20).intersection(Period(15, 25)),
          Period(15, 20));
    });

    it('merges subjects with PeriodSeq, those of self first', () => {
      const period = Period(10, 20, 'subject1');
      const periodSeq = PeriodSeq([Period(5, 12, 'subject2'), Period(15, 25, 'subject3')]);

      const intersection = period.intersection(periodSeq);
      expect(isPeriodSeq(intersection)).toBe(true);
      periodEq(intersection, PeriodSeq([
        Period(10, 12, ['subject1', 'subject2']),
        Period(15, 20, ['subject1', 'subject3']),
      ]));
    });

    it('merges subjects with dayjs', () => {
      const subject1 = { name: 'sub1' };
      const subject2 = { name: 'sub2' };

      const period1 = testPeriodDayjs(
        '2019-10-09T23:59:59.000+02:00',
        '2019-10-10T00:00:05.000+02:00',
        subject1
      );
      const period2 = testPeriodDayjs(
        '2019-10-09T00:00:00.000+02:00',
        '2019-10-10T00:00:00.000+02:00',
        subject2
      );

      const intersection = period1.intersection(period2);
      if (!isPeriod(intersection)) {
        throw new Error('Expected Period');
      }

      const period3 = testPeriodDayjs(
        '2019-10-09T23:59:59.000+02:00',
        '2019-10-10T00:00:00.000+02:00',
        [subject1, subject2]
      );
      periodEq(intersection, period3);
    });

    it('applies propsMerger', () => {
      interface CustomProps {
        priority: number;
        tags: string[];
      }

      const propsMerger: PropsMerger<CustomProps> = (sourcePeriod: any, otherPeriod?: any): CustomProps => {
        const sourcePriority = sourcePeriod.priority ?? 1;
        const otherPriority = otherPeriod?.priority ?? 1;
        const sourceTags = sourcePeriod.tags ?? [];
        const otherTags = otherPeriod?.tags ?? [];

        return {
          priority: Math.max(sourcePriority, otherPriority),
          tags: [...sourceTags, ...otherTags]
        };
      };

      // Create periods with subjects propsMerger
      const period1 = Period(10, 30, ['subject1'], propsMerger);
      const period2 = Period(15, 35, ['subject2']);
      const period3 = Period(20, 40, undefined, propsMerger);
      // Add custom properties to test the merger
      Object.assign(period1, { priority: 1, tags: ['tag1'] });
      Object.assign(period3, { priority: 3, tags: ['tag3a', 'tag3b'] });

      const intersection = period1.intersection(period2).intersection(period3);
      const customIntersection = intersection as any;
      expect(customIntersection.priority).toBe(3); // max of 1 and 3
      expect(customIntersection.tags).toEqual(['tag1', 'tag3a', 'tag3b']);
    });

    it('does not apply propsMerger when result is empty', () => {
      const propsMerger = (_sourcePeriod: any, _otherPeriod?: any) => ({
        merged: true
      });

      const emptyPeriod = Period(10, 10, ['subject'], propsMerger);
      const period2 = Period(20, 30, ['subject2'], propsMerger);
      // This would create an empty period, which should not trigger propsMerger
      const result = emptyPeriod.intersection(period2);
      expect(result.isEmpty()).toBe(true);
      expect((result as any).merged).toBeUndefined();
    });
  });

  describe('union()', () => {
    it('with Period', () => {
      let period1 = Period(10, 16);
      let period2 = Period(14, 20);

      let union = period1.union(period2);
      expect(isPeriod(union)).toBe(true);
      periodEq(union, Period(10, 20));

      period1 = Period(10, 15);
      period2 = Period(11, 12);
      periodEq(period1.union(period2), period1);

      period1 = Period(-40, -20);
      period2 = Period(-60, 10);
      periodEq(period1.union(period2), period2);

      period1 = Period(0, 10);
      period2 = Period(10, 30); // Touching
      union = period1.union(period2);
      expect(isPeriod(union)).toBe(true);
      periodEq(union, Period(0, 30));

      period1 = Period(50, 100);
      period2 = Period(1, 2);
      union = period1.union(period2);
      expect(union.isEmpty()).toBe(false);
      expect(isPeriodSeq(union)).toBe(true);
      expect(union.periods().length).toBe(2);
      periodEq(union.periods()[0]!, period2);
      periodEq(union.periods()[1]!, period1);
    });

    it('with PeriodSeq', () => {
      const period1 = Period(10, 20);

      const periodSeq = PeriodSeq([Period(15, 25), Period(30, 35)]);

      let union = period1.union(periodSeq);
      expect(isPeriodSeq(union)).toBe(true);
      expect(union.periods().length).toBe(2);
      periodEq(union.periods()[0]!, Period(10, 25));
      periodEq(union.periods()[1]!, Period(30, 35));

      // period falls in a gap of the sequence
      union = Period(25, 35).union(PeriodSeq([Period(10, 20), Period(40, 50)]));
      periodEq(union, PeriodSeq([Period(10, 20), Period(25, 35), Period(40, 50)]));
    });

    it('with empty period', () => {
      const period = Period(10, 20);
      expect(period.union(theEmptyPeriod)).toBe(period);

      const normalPeriod = Period(5, 15);
      const periodSeq = PeriodSeq([Period(20, 30), Period(40, 50)]);

      expect(empty.union(normalPeriod).eq(normalPeriod)).toBe(true);
      expect(empty.union(periodSeq).eq(periodSeq)).toBe(true);
      expect(empty.union(empty).eq(empty)).toBe(true);
    });

    it('keeps the custom comparable objects of the inputs', () => {
      const v = [Version(0), Version(1), Version(2), Version(3)] as const;
      const union = testPeriod(v[0], v[2]).union(Period(v[1], v[3]));

      expect(isPeriod(union)).toBe(true);
      expect((union as IPeriod).start).toBe(v[0]);
      expect((union as IPeriod).end).toBe(v[3]);
    });

    it('merges subjects', () => {
      const period1 = Period(10, 20, ['subject1']);
      const period2 = Period(15, 25, ['subject2']);

      periodEq(period1.union(period2), Period(10, 25, ['subject1', 'subject2']));
    });

    it('merges subjects with PeriodSeq, those of self first', () => {
      const period = Period(10, 20, 'subject1');
      const periodSeq = PeriodSeq([Period(5, 12, 'subject2'), Period(30, 40, 'subject3')]);

      periodEq(period.union(periodSeq), PeriodSeq([
        Period(5, 20, ['subject1', 'subject2']),
        Period(30, 40, ['subject3']),
      ]));
    });

    it('applies propsMerger', () => {
      interface CustomProps {
        level: string;
      }

      const propsMerger: PropsMerger<CustomProps> = (sourcePeriod: any, otherPeriod?: any): CustomProps => {
        const sourceLevel = sourcePeriod.level ?? 'low';
        const otherLevel = otherPeriod?.level ?? 'low';

        return {
          level: sourceLevel === 'high' || otherLevel === 'high' ? 'high' : 'medium'
        };
      };

      const period1 = Period(10, 20, ['subject1'], propsMerger);
      const period2 = Period(20, 30, ['subject2'], propsMerger);
      Object.assign(period1, { level: 'high' });
      Object.assign(period2, { level: 'medium' });

      const union = period1.union(period2);
      expect(isPeriod(union)).toBe(true);
      expect((union as any).level).toBe('high');
    });
  });

  describe('subtract()', () => {
    const period1 = Period(100, 200, ['subject1']);
    const period1a = Period(100, 110, ['subject1a']);
    const period2 = Period(150, 250, ['subject2']);
    const period3 = Period(50, 250, ['subject3']);

    it('with Period', () => {
      periodEq(period1.subtract(period2), Period(100, 150, ['subject1']));
      periodEq(period1.subtract(period1a), Period(110, 200, ['subject1']));

      expect(period1.subtract(period3).isEmpty()).toBe(true);
    });

    it('with Period contained inside (splits in two)', () => {
      const result = period3.subtract(period1);
      expect(result.periods().length).toBe(2);
      periodEq(result.periods()[0]!, Period(50, 100, ['subject3']));
      periodEq(result.periods()[1]!, Period(200, 250, ['subject3']));
    });

    it('with PeriodSeq', () => {
      let result = period1a.subtract(PeriodSeq([period1a, period2]));
      expect(result.isEmpty()).toBe(true);

      result = period1.subtract(PeriodSeq([Period(110, 120), Period(150, 160)]));
      expect(result.periods().length).toBe(3);
      periodEq(result.periods()[0]!, Period(100, 110, ['subject1']));
      periodEq(result.periods()[1]!, Period(120, 150, ['subject1']));
      periodEq(result.periods()[2]!, Period(160, 200, ['subject1']));
    });

    it('with empty period', () => {
      expect(empty.subtract(Period(5, 15)).isEmpty()).toBe(true);
      expect(empty.subtract(PeriodSeq([Period(20, 30)])).isEmpty()).toBe(true);
      expect(empty.subtract(empty).isEmpty()).toBe(true);
    });

    it('returns same instance when nothing is removed', () => {
      // Since periods are immutable, operations that don't change the period
      // should return the same reference for efficiency
      const period = Period(10, 20, ['subject1', 'subject2']);
      const subtractNoOverlap = period.subtract(Period(30, 40));

      expect(subtractNoOverlap).toBe(period);
      expect(subtractNoOverlap.eq(period)).toBe(true);
      periodEq(subtractNoOverlap, period);

      // Custom props from a propsMerger are preserved
      const propsMerger = (_sourcePeriod: any, _otherPeriod?: any) => ({
        customValue: 42
      });
      const withProps = Period(10, 20, ['subject'], propsMerger);

      expect(withProps.subtract(Period(30, 40))).toBe(withProps);
      expect((withProps as any).customValue).toBe(42);
    });

    it('keeps props of the source period with propsMerger', () => {
      interface CustomProps {
        count: number;
      }

      const propsMerger: PropsMerger<CustomProps> = (sourcePeriod: any, otherPeriod?: any): CustomProps => {
        const sourceCount = sourcePeriod.count ?? 0;
        const otherCount = otherPeriod?.count ?? 0;

        return {
          count: sourceCount + otherCount
        };
      };

      const period1 = Period(10, 50, ['subject1'], propsMerger);
      const period2 = Period(20, 30, ['subject2'], propsMerger);

      Object.assign(period1, { count: 5 });
      Object.assign(period2, { count: 3 });

      const subtraction = period1.subtract(period2);
      const firstPeriod = subtraction.periods()[0]! as any;
      const secondPeriod = subtraction.periods()[1]! as any;
      // subtract() merges no props from the other period, since it only affects intersection/union
      expect(firstPeriod.count).toBe(5); // Original count from result1
      expect(secondPeriod.count).toBe(5); // Original count from result1
    });
  });

  describe('mix()', () => {
    const period = Period(100, 200, "subject1");

    it('with Period', () => {
      const mixed = period.mix(Period(50, 150, "subject2"));

      expect(isPeriodSeq(mixed)).toBe(true);
      expect(mixed.periods().length).toBe(3);
      periodEq(mixed.periods()[0]!, Period(50, 100, ["subject2"]));
      periodEq(mixed.periods()[1]!, Period(100, 150, ["subject1", "subject2"]));
      periodEq(mixed.periods()[2]!, Period(150, 200, ["subject1"]));
    });

    it('with equal Period returns a Period', () => {
      const mixed = period.mix(Period(100, 200, "subject2"));

      expect(isPeriod(mixed)).toBe(true);
      periodEq(mixed, Period(100, 200, ["subject1", "subject2"]));
    });

    it('with PeriodSeq', () => {
      const mixed = period.mix(PeriodSeq([Period(50, 150, "subject2"), Period(180, 250, "subject3")]));

      periodEq(mixed, PeriodSeq([
        Period(50, 100, ["subject2"]),
        Period(100, 150, ["subject1", "subject2"]),
        Period(150, 180, ["subject1"]),
        Period(180, 200, ["subject1", "subject3"]),
        Period(200, 250, ["subject3"]),
      ]));
    });

    it('with empty period', () => {
      expect(period.mix(theEmptyPeriod)).toBe(period);

      const mixed = empty.mix(Period(50, 150, ["subject1"]));

      expect(mixed.periods().length).toBe(1);
      periodEq(mixed.periods()[0]!, Period(50, 150, ["subject1"]));

      periodEq(empty.mix(empty), empty);
    });
  });

  describe('toString() and toCompactString()', () => {
    it('with Period', () => {
      const period = Period(10, 20);
      expect(period.toString()).toBe("Period(10, 20)");
      expect(period.toCompactString()).toBe("(10, 20)");
    });

    it('with empty period', () => {
      expect(Period(5, 5).toString()).toBe("Period [empty]");
      expect(Period(5, 5).toCompactString()).toBe("[empty]");
    });
  });

  // ===== INTERNAL API TESTS =====
  // These tests access internal properties for mutation testing coverage
  // They should not be used as examples of how to use the library

  describe('internal API', () => {
    it('provides _getStart() and _getEnd() for internal use', () => {
      const period = testPeriod(10, 20);

      expect(period._getStart().source).toBe(10);
      expect(period._getEnd().source).toBe(20);
    });
  });
});
