import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { DayjsLike, PeriodLike } from './index.js';
import {
  intersection,
  isPeriod,
  mix,
  Period,
  PeriodSeq,
  theEmptyPeriod,
  union,
} from './index.js';
import { periodEq, periodSeqEq, Version } from './testHelpers.js';

// The n-ary union(), intersection() and mix() functions, for periods that may overlap.
// Case order within a block:
//   with Periods, with PeriodSeqs, with empty period, special cases, subjects, propsMerger.

describe('n-ary operations', () => {

  const namesMerger = (sourcePeriod: any, otherPeriod?: any) => ({
    names: [...(sourcePeriod.names ?? []), ...(otherPeriod?.names ?? [])]
  });
  const named = (start: number, end: number, name: string) =>
      Object.assign(Period(start, end, [], namesMerger), { names: [name] });

  describe('union()', () => {
    it('with Periods', () => {
      const booked = union([Period(14, 16), Period(9, 11), Period(10, 12), Period(12, 13)]);
      periodSeqEq(booked, [[9, 13], [14, 16]]);

      // A single period is returned as a Period
      const merged = union([Period(1, 5), Period(3, 8), Period(2, 4)]);
      expect(isPeriod(merged)).toBe(true);
      periodEq(merged, Period(1, 8));
    });

    it('with PeriodSeqs', () => {
      const result = union([
        PeriodSeq([Period(10, 20), Period(30, 40)]),
        PeriodSeq([Period(15, 25), Period(35, 45)]),
        Period(50, 60),
      ]);
      periodSeqEq(result, [[10, 25], [30, 45], [50, 60]]);
    });

    it('with empty period', () => {
      const period = Period(1, 5);
      expect(union([])).toBe(theEmptyPeriod);
      expect(union([theEmptyPeriod, Period(5, 5)])).toBe(theEmptyPeriod);
      expect(union([theEmptyPeriod, period])).toBe(period);
    });

    it('merges touching periods', () => {
      periodEq(union([Period(20, 30), Period(10, 20), Period(30, 40)]), Period(10, 40));
    });

    it('keeps periods that are not merged as they are', () => {
      const a = Period(1, 2);
      const b = Period(5, 6);
      const result = union([b, a, Period(1, 2)]);
      expect(result.periods()[1]).toBe(b);
    });

    it('with other value types', () => {
      const date = (day: number) => new Date(Date.UTC(2026, 0, day));
      periodSeqEq(union([Period(date(5), date(10)), Period(date(1), date(6)), Period(date(20), date(25))]),
          [[date(1), date(10)], [date(20), date(25)]]);

      const day = (d: string) => dayjs(d) as unknown as DayjsLike;
      periodEq(union([Period(day('2026-01-05'), day('2026-01-10')), Period(day('2026-01-01'), day('2026-01-06'))]),
          Period(day('2026-01-01'), day('2026-01-10')));

      // Version holds functions, which can't be compared deeply
      expect(union([Period(Version(3), Version(5)), Period(Version(1), Version(4))])
          .eq(Period(Version(1), Version(5)))).toBe(true);
    });

    it('merges subjects in the order the periods are given', () => {
      periodEq(union([Period(10, 20, 'a'), Period(5, 15, 'b')]), Period(5, 20, ['a', 'b']));

      // e joins the runs a+c and b+d, which are each merged in the order given too
      const result = union([
        Period(0, 2, 'a'),
        Period(5, 7, 'b'),
        Period(1, 3, 'c'),
        Period(6, 8, 'd'),
        Period(2, 6, 'e'),
      ]);
      periodEq(result, Period(0, 8, ['a', 'b', 'c', 'd', 'e']));
    });

    it('merges props in the order the periods are given', () => {
      const result = union([named(10, 20, 'a'), named(5, 15, 'b'), named(15, 25, 'c')]);
      periodEq(result, Period(5, 25));
      expect((result as any).names).toEqual(['a', 'b', 'c']);
    });
  });

  describe('intersection()', () => {
    it('with Periods', () => {
      periodEq(intersection([Period(8, 17), Period(9, 12), Period(10, 20)]), Period(10, 12));
      expect(intersection([Period(8, 12), Period(10, 20), Period(14, 16)])).toBe(theEmptyPeriod);
    });

    it('with PeriodSeqs', () => {
      // The time when everyone is free
      const alice = PeriodSeq([Period(8, 10), Period(12, 17)]);
      const bob = PeriodSeq([Period(9, 13), Period(15, 18)]);
      const carol = Period(8, 16);
      periodSeqEq(intersection([alice, bob, carol]), [[9, 10], [12, 13], [15, 16]]);
    });

    it('with empty period', () => {
      expect(intersection([])).toBe(theEmptyPeriod);
      expect(intersection([Period(1, 5), theEmptyPeriod])).toBe(theEmptyPeriod);
    });

    it('returns a single PeriodLike as it is', () => {
      const seq = PeriodSeq([Period(1, 2), Period(3, 4)]);
      expect(intersection([seq])).toBe(seq);
    });

    it('with other value types', () => {
      const date = (day: number) => new Date(Date.UTC(2026, 0, day));
      periodEq(intersection([Period(date(1), date(10)), Period(date(5), date(20))]), Period(date(5), date(10)));

      expect(intersection([Period(Version(1), Version(4)), Period(Version(3), Version(5))])
          .eq(Period(Version(3), Version(4)))).toBe(true);
    });

    it('merges subjects in the order the periods are given', () => {
      periodEq(intersection([Period(0, 10, 'a'), Period(5, 15, 'b'), Period(2, 8, 'c')]),
          Period(5, 8, ['a', 'b', 'c']));
    });

    it('merges props in the order the periods are given', () => {
      const result = intersection([named(0, 10, 'a'), named(5, 15, 'b'), named(2, 8, 'c')]);
      expect((result as any).names).toEqual(['a', 'b', 'c']);
    });
  });

  describe('mix()', () => {
    it('with Periods', () => {
      const result = mix([Period(9, 12, 'Alice'), Period(11, 15, 'Bob'), Period(10, 13, 'Carol')]);
      periodEq(result, PeriodSeq([
        Period(9, 10, ['Alice']),
        Period(10, 11, ['Alice', 'Carol']),
        Period(11, 12, ['Alice', 'Bob', 'Carol']),
        Period(12, 13, ['Bob', 'Carol']),
        Period(13, 15, ['Bob']),
      ]));
    });

    it('with PeriodSeqs', () => {
      const result = mix([PeriodSeq([Period(10, 30), Period(50, 70)]), PeriodSeq([Period(20, 40), Period(60, 70)])]);
      periodSeqEq(result, [[10, 20], [20, 30], [30, 40], [50, 60], [60, 70]]);
    });

    it('with empty period', () => {
      const period = Period(1, 5);
      expect(mix([])).toBe(theEmptyPeriod);
      expect(mix([theEmptyPeriod, period, Period(5, 5)])).toBe(period);
    });

    it('gives the same periods and subjects as mix() of one period at a time', () => {
      const periods = [7, 3, 12, 1, 9, 15, 4, 20, 2].map(start => Period(start, start + start % 4 + 3, `s${start}`));
      const oneAtATime = periods.reduce<PeriodLike>((result, period) => result.mix(period), theEmptyPeriod);
      periodEq(mix(periods), oneAtATime);
    });

    it('keeps touching periods apart', () => {
      periodSeqEq(mix([Period(2, 3), Period(1, 2)]), [[1, 2], [2, 3]]);
    });

    it('with other value types', () => {
      const versions = (from: number, to: number) => Period(Version(from), Version(to));
      expect(mix([versions(1, 4), versions(3, 5)])
          .eq(PeriodSeq([versions(1, 3), versions(3, 4), versions(4, 5)]))).toBe(true);
    });

    it('merges props in the order the periods are given', () => {
      const result = mix([named(0, 10, 'a'), named(5, 15, 'b')]);
      expect(result.periods().map(period => (period as any).names)).toEqual([['a'], ['a', 'b'], ['b']]);
    });
  });
});
