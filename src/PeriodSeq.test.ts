import { describe, expect, it } from 'vitest';
import type { IPeriodSeq } from './index.js';
import {
  isPeriod,
  isPeriodSeq,
  Period,
  PeriodSeq,
  theEmptyPeriod,
} from './index.js';
import { periodEq, periodSeqEq, Version } from './testHelpers.js';

// Block order (same in Period.test.ts):
//   factory, accessors, predicates, set operations, toString.
// Case order within a block:
//   with Period, with PeriodSeq, with empty period, special cases, subjects, propsMerger.

describe('PeriodSeq', () => {

  const periodSeq = PeriodSeq([Period(100, 150), Period(200, 250)]);

  describe('factory', () => {
    it('filters out empty periods', () => {
      const empty = Period(5, 5);
      const nonEmpty = Period(1, 3);
      const seq = PeriodSeq([empty, nonEmpty, empty]);
      expect(seq.periods().length).toBe(1);
      periodEq(seq.periods()[0]!, nonEmpty);

      const mixed = PeriodSeq([Period(10, 10), Period(5, 15), Period(20, 20), Period(25, 35)]);
      periodSeqEq(mixed, [[5, 15], [25, 35]]);
    });

    it('flattens nested PeriodSeq', () => {
      const innerSeq = PeriodSeq([Period(10, 20), Period(30, 40)]);
      const period = Period(50, 60);

      const outerSeq = PeriodSeq([innerSeq, period]);
      periodSeqEq(outerSeq, [[10, 20], [30, 40], [50, 60]]);
    });

    it('gives the simplest kind that holds the periods', () => {
      expect(PeriodSeq([])).toBe(theEmptyPeriod);
      expect(PeriodSeq([Period(5, 5)])).toBe(theEmptyPeriod);

      const period = Period(10, 20);
      expect(PeriodSeq([period])).toBe(period);
      expect(PeriodSeq([Period(5, 5), period])).toBe(period);

      expect(isPeriodSeq(PeriodSeq([period, Period(30, 40)]))).toBe(true);
    });

    it('creates a frozen PeriodSeq', () => {
      expect(Object.isFrozen(periodSeq)).toBe(true);
    });
  });

  describe('isEmpty()', () => {
    it('with PeriodSeq and empty PeriodSeq', () => {
      expect(periodSeq.isEmpty()).toBe(false);
      expect(PeriodSeq([]).isEmpty()).toBe(true);
      expect(periodSeq.subtract(periodSeq).isEmpty()).toBe(true);
    });
  });

  describe('periods()', () => {
    it('with PeriodSeq', () => {
      expect(periodSeq.periods().length).toBe(2);
      periodEq(periodSeq.periods()[0]!, Period(100, 150));
      periodEq(periodSeq.periods()[1]!, Period(200, 250));
    });

    it('with empty PeriodSeq', () => {
      expect(PeriodSeq([]).periods().length).toBe(0);
    });

    it('returns the same frozen array every time', () => {
      expect(periodSeq.periods()).toBe(periodSeq.periods());
      expect(Object.isFrozen(periodSeq.periods())).toBe(true);
    });
  });

  describe('length()', () => {
    it('with PeriodSeq', () => {
      const seq1 = PeriodSeq([Period(10, 20), Period(30, 40)]);
      expect(seq1.length()).toBe(20);

      const seq2 = PeriodSeq([Period(5, 15), Period(25, 30), Period(50, 50)]);
      expect(seq2.length()).toBe(10 + 5 + 0);
    });

    it('with empty PeriodSeq', () => {
      expect(PeriodSeq([]).length()).toBe(0);
    });

    it('with a custom comparable type', () => {
      const seq = PeriodSeq([Period(Version(10), Version(20)), Period(Version(30), Version(35))]);
      expect(seq.length()).toBe(15);
    });
  });

  describe('eq()', () => {
    it('with Period', () => {
      expect(periodSeq.eq(Period(140, 220))).toBe(false);
      expect(periodSeq.eq(Period(100, 150))).toBe(false);
    });

    it('with PeriodSeq', () => {
      const periodSeq2 = PeriodSeq([Period(200, 250), Period(100, 150)]);
      const periodSeq3 = PeriodSeq([Period(100, 150), Period(200, 250), Period(300, 350)]);
      const periodSeq4 = PeriodSeq([Period(100, 150), Period(200, 251)]);

      expect(periodSeq.eq(periodSeq2)).toBe(true);
      expect(periodSeq.eq(periodSeq3)).toBe(false);
      expect(periodSeq3.eq(periodSeq)).toBe(false);
      expect(periodSeq.eq(periodSeq4)).toBe(false);
    });

    it('with empty period', () => {
      expect(periodSeq.eq(PeriodSeq([Period(1, 1)]))).toBe(false);
    });
  });

  describe('overlaps()', () => {
    it('with Period', () => {
      expect(periodSeq.overlaps(Period(140, 220))).toBe(true);
      expect(periodSeq.overlaps(Period(160, 170))).toBe(false);
    });

    it('with PeriodSeq', () => {
      expect(periodSeq.overlaps(PeriodSeq([Period(111,112), Period(222, 223)]))).toBe(true);
      expect(periodSeq.overlaps(PeriodSeq([Period(90,100), Period(250, 260)]))).toBe(false);
    });
  });

  describe('touches()', () => {
    const seq1 = PeriodSeq([Period(10, 20), Period(30, 40)]);

    it('with PeriodSeq', () => {
      const seq2 = PeriodSeq([Period(40, 50), Period(60, 70)]);
      const seq3 = PeriodSeq([Period(1, 9), Period(25, 30)]);
      const seq4 = PeriodSeq([Period(50, 60), Period(70, 80)]);

      expect(seq1.touches(seq2)).toBe(true);
      expect(seq1.touches(seq3)).toBe(true);
      expect(seq1.touches(seq4)).toBe(false);
    });

    it('with empty period', () => {
      expect(seq1.touches(Period(5, 5))).toBe(false);
    });
  });

  describe('contains()', () => {
    const seq = PeriodSeq([Period(10, 30), Period(40, 60)]);

    it('with Period', () => {
      expect(seq.contains(Period(15, 25))).toBe(true);
      expect(seq.contains(Period(35, 45))).toBe(false);
    });

    it('with PeriodSeq', () => {
      const contained1 = PeriodSeq([Period(15, 25), Period(40, 50)]);
      const contained2 = PeriodSeq([Period(10, 11), Period(45, 60)]);
      const notContained = PeriodSeq([Period(5, 15), Period(45, 55)]);

      expect(seq.contains(contained1)).toBe(true);
      expect(seq.contains(contained2)).toBe(true);
      expect(seq.contains(notContained)).toBe(false);
    });

    it('with empty period', () => {
      // Never contains the empty period
      expect(seq.contains(Period(5, 5))).toBe(false);
    });

    it('lets touching periods contain together', () => {
      const touchingSeq = PeriodSeq([Period(10, 20), Period(20, 30), Period(40, 50)]);

      expect(touchingSeq.contains(Period(15, 25))).toBe(true);
      expect(touchingSeq.contains(Period(10, 30))).toBe(true);
      expect(touchingSeq.contains(PeriodSeq([Period(12, 28), Period(40, 50)]))).toBe(true);

      expect(touchingSeq.contains(Period(25, 45))).toBe(false); // Gap between 30 and 40
      expect(touchingSeq.contains(Period(5, 15))).toBe(false); // Starts before 10
      expect(touchingSeq.contains(Period(45, 55))).toBe(false); // Ends after 50
    });
  });

  describe('existsAt()', () => {
    it('with positions inside, on and outside boundaries', () => {
      expect(periodSeq.existsAt(17)).toBe(false);
      expect(periodSeq.existsAt(100)).toBe(true);
      expect(periodSeq.existsAt(150)).toBe(true);
      expect(periodSeq.existsAt(199)).toBe(false);
      expect(periodSeq.existsAt(200)).toBe(true);
      expect(periodSeq.existsAt(250)).toBe(true);
      expect(periodSeq.existsAt(251)).toBe(false);
    });
  });

  describe('periodsAt()', () => {
    it('with positions inside, on and outside boundaries', () => {
      const sequence = PeriodSeq([Period(10, 20), Period(30, 40)]);

      expect(isPeriodSeq(sequence)).toBe(true);
      const seq = sequence as IPeriodSeq;

      expect(seq.periodsAt(5)).toEqual([]);
      expect(seq.periodsAt(10)).toEqual([sequence.periods()[0]]);
      expect(seq.periodsAt(15).length).toBe(1);
      expect(seq.periodsAt(20).length).toBe(1);
      expect(seq.periodsAt(25).length).toBe(0);
      expect(seq.periodsAt(30).length).toBe(1);
      expect(seq.periodsAt(35)).toEqual([sequence.periods()[1]]);
      expect(seq.periodsAt(40).length).toBe(1);
      expect(seq.periodsAt(45).length).toBe(0);
    });

    it('with a custom comparable type', () => {
      const sequence = PeriodSeq([Period(Version(10), Version(20)), Period(Version(30), Version(40))]);

      expect(sequence.existsAt(Version(15))).toBe(true);
      expect((sequence as IPeriodSeq).periodsAt(Version(35))).toEqual([sequence.periods()[1]]);
      expect((sequence as IPeriodSeq).periodsAt(Version(25))).toEqual([]);
    });
  });

  describe('intersection()', () => {
    it('with Period', () => {
      let intersectSeq = periodSeq.intersection(Period(140, 220));
      periodSeqEq(intersectSeq, [[140, 150], [200, 220]]);

      intersectSeq = periodSeq.intersection(Period(180, 200));
      expect(intersectSeq.isEmpty()).toBe(true);

      intersectSeq = periodSeq.intersection(Period(0, 500));
      periodSeqEq(intersectSeq, [[100, 150], [200, 250]]);
      expect(intersectSeq.eq(periodSeq)).toBe(true);
    });

    it('with PeriodSeq', () => {
      const periodSeq2 = PeriodSeq([
        Period(150, 160),
        Period(200, 205),
        Period(400, 500),
      ]);

      let intersectSeq = periodSeq.intersection(periodSeq2);
      periodEq(intersectSeq, Period(200, 205));

      const periodSeq3 = PeriodSeq([
        Period(150, 200),
        Period(250, 300),
      ]);
      intersectSeq = periodSeq.intersection(periodSeq3);
      expect(intersectSeq.isEmpty()).toBe(true);
    });

    it('with empty period', () => {
      expect(periodSeq.intersection(theEmptyPeriod).isEmpty()).toBe(true);
    });

    it('skips periods starting after all other periods end', () => {
      const seq1 = PeriodSeq([Period(10, 15), Period(20, 25), Period(60, 70)]);
      const seq2 = PeriodSeq([Period(12, 18), Period(22, 28), Period(50, 55)]);

      const intersection = seq1.intersection(seq2);
      // Should have intersections from first two pairs, but third period starts after last other period ends
      periodSeqEq(intersection, [[12, 15], [22, 25]]);
    });

    it('intersects periods that overlap several other periods', () => {
      const seq1 = PeriodSeq([Period(10, 50, 'a1'), Period(60, 70, 'a2')]);
      // (45, 65) overlaps both periods of seq1
      const seq2 = PeriodSeq([Period(5, 15, 'b1'), Period(20, 30, 'b2'), Period(45, 65, 'b3')]);

      periodEq(seq1.intersection(seq2), PeriodSeq([
        Period(10, 15, ['a1', 'b1']),
        Period(20, 30, ['a1', 'b2']),
        Period(45, 50, ['a1', 'b3']),
        Period(60, 65, ['a2', 'b3']),
      ]));
    });
  });

  describe('union()', () => {
    it('with Period', () => {
      periodEq(periodSeq.union(Period(150, 200)), Period(100, 250));
      periodEq(periodSeq.union(Period(120, 320)), Period(100, 320));

      // last period is not merged
      periodSeqEq(periodSeq.union(Period(300, 400)), [[100, 150], [200, 250], [300, 400]]);
    });

    it('with PeriodSeq', () => {
      periodEq(periodSeq.union(periodSeq), periodSeq);

      // A single period is returned as a Period
      const periodSeqFillsHole = PeriodSeq([Period(150, 200), Period(250, 270)]);
      const filled = periodSeq.union(periodSeqFillsHole);
      expect(isPeriod(filled)).toBe(true);
      periodEq(filled, Period(100, 270));

      const periodSeqOverlaps = PeriodSeq([Period(110, 160), Period(260, 270)]);
      periodEq(periodSeq.union(periodSeqOverlaps),
          PeriodSeq([
            Period(100, 160),
            Period(200, 250),
            Period(260, 270),
          ]));

      const periodSeqTouches = PeriodSeq([Period(150, 160), Period(260, 270)]);
      periodEq(periodSeq.union(periodSeqTouches),
          PeriodSeq([
            Period(100, 160),
            Period(200, 250),
            Period(260, 270),
          ]));

      const periodSeqNoMerge = PeriodSeq([Period(160, 170), Period(260, 270)]);
      periodEq(periodSeq.union(periodSeqNoMerge),
          PeriodSeq([
            Period(100, 150),
            Period(160, 170),
            Period(200, 250),
            Period(260, 270),
          ]));

      // overlapping periods on both sides require merging
      const union = PeriodSeq([Period(10, 20), Period(30, 40)])
          .union(PeriodSeq([Period(15, 25), Period(35, 45)]));
      periodSeqEq(union, [[10, 25], [30, 45]]);

      // Touching periods merge too, here into a single period, which is returned as a Period
      const touching = PeriodSeq([Period(10, 20), Period(30, 40)])
          .union(PeriodSeq([Period(20, 30), Period(40, 50)]));
      expect(isPeriod(touching)).toBe(true);
      periodEq(touching, Period(10, 50));
    });

    it('with empty period', () => {
      expect(periodSeq.union(theEmptyPeriod)).toBe(periodSeq);
      periodEq(periodSeq.union(Period(5, 5)), periodSeq);
    });

    it('merges subjects, those of self first', () => {
      const seq = PeriodSeq([Period(10, 20, 'a1'), Period(30, 40, 'a2'), Period(60, 70, 'a3')]);

      const union = seq.union(PeriodSeq([Period(5, 35, 'b1'), Period(80, 90, 'b2')]));
      periodEq(union, PeriodSeq([
        Period(5, 40, ['a1', 'a2', 'b1']),
        Period(60, 70, ['a3']),
        Period(80, 90, ['b2']),
      ]));

      // Periods that are not merged are kept as they are
      expect(union.periods()[1]).toBe(seq.periods()[2]);
    });

    it('merges the props of all periods in a run, those of self first', () => {
      const propsMerger = (sourcePeriod: any, otherPeriod?: any) => ({
        names: [...(sourcePeriod.names ?? []), ...(otherPeriod?.names ?? [])]
      });
      const a1 = Object.assign(Period(10, 20, [], propsMerger), { names: ['a1'] });
      const a2 = Object.assign(Period(30, 40, [], propsMerger), { names: ['a2'] });
      const b1 = Object.assign(Period(5, 35, [], propsMerger), { names: ['b1'] });

      const union = PeriodSeq([a1, a2]).union(b1);
      periodEq(union, Period(5, 40));
      expect((union.periods()[0] as any).names).toEqual(['a1', 'a2', 'b1']);
    });
  });

  describe('subtract()', () => {
    const seq = PeriodSeq([Period(10, 30), Period(40, 60)]);

    it('with Period', () => {
      const seq2 = PeriodSeq([Period(10, 20), Period(30, 40)]);

      periodEq(seq2.subtract(Period(30, 40)), Period(10, 20));
      // A new PeriodSeq, also when the number of periods stays the same
      periodSeqEq(seq2.subtract(Period(15, 20)), [[10, 15], [30, 40]]);
    });

    it('with PeriodSeq', () => {
      const subtractSeq = PeriodSeq([Period(15, 25), Period(45, 55)]);

      let result = seq.subtract(subtractSeq);
      periodSeqEq(result, [[10, 15], [25, 30], [40, 45], [55, 60]]);

      const seqCover2 = PeriodSeq([Period(25, 35), Period(39, 65)]);

      result = seq.subtract(seqCover2);
      periodEq(result, Period(10, 25));
    });

    it('with empty period', () => {
      expect(seq.subtract(Period(5, 5)).eq(seq)).toBe(true);
    });

    it('subtracts other periods that overlap several periods', () => {
      const seq1 = PeriodSeq([Period(10, 50), Period(60, 70)]);
      // (45, 65) overlaps both periods of seq1
      const seq2 = PeriodSeq([Period(5, 15), Period(20, 30), Period(45, 65)]);

      periodSeqEq(seq1.subtract(seq2), [[15, 20], [30, 45], [65, 70]]);
    });

    it('returns self when other overlaps none of the periods', () => {
      const seq2 = PeriodSeq([Period(10, 20), Period(30, 40)]);

      expect(seq2.subtract(Period(20, 30))).toBe(seq2); // Only touches
      expect(seq2.subtract(PeriodSeq([Period(0, 5), Period(50, 60)]))).toBe(seq2);
    });
  });

  describe('mix()', () => {
    it('with PeriodSeq', () => {
      const seq1 = PeriodSeq([Period(10, 30), Period(50, 70)]);
      const seq2 = PeriodSeq([Period(20, 40), Period(60, 70)]);

      const mixed = seq1.mix(seq2);
      periodSeqEq(mixed, [[10, 20], [20, 30], [30, 40], [50, 60], [60, 70]]);

      const seq2b = PeriodSeq([Period(10, 40), Period(50, 70)]);
      const mixed2 = seq1.mix(seq2b);
      periodSeqEq(mixed2, [[10, 30], [30, 40], [50, 70]]);

      const seq2c = PeriodSeq([Period(10, 20), Period(55, 60)]);
      const mixed32 = seq1.mix(seq2c);
      periodSeqEq(mixed32, [[10, 20], [20, 30], [50, 55], [55, 60], [60, 70]]);
    });

    it('with empty period', () => {
      expect(periodSeq.mix(theEmptyPeriod)).toBe(periodSeq);
    });
  });

  describe('toString() and toCompactString()', () => {
    it('with PeriodSeq', () => {
      const seq = PeriodSeq([Period(10, 20), Period(30, 40)]);

      expect(seq.toString()).toBe('Seq[Period(10, 20), Period(30, 40)]');
      expect(seq.toCompactString()).toBe('[(10, 20), (30, 40)]');
    });
  });
});
