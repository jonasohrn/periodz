import { expect } from 'vitest';
import dayjs from 'dayjs';
import type { IPeriod, ComparableValue, DayjsLike, PeriodLike, PeriodSubject } from './index.js';
import { isEmpty, isPeriod, isPeriodSeq, Period } from './index.js';

// Shared test helpers. Kept out of *.test.ts files so that importing them
// does not re-register another file's describe-blocks.

// Helper function that always returns a Period (for test cases where we know start < end)
export const testPeriod = (start: ComparableValue, end: ComparableValue, subjects?: PeriodSubject | readonly PeriodSubject[]): IPeriod => {
  const result = Period(start, end, subjects);
  if (!isPeriod(result)) {
    throw new Error('Expected Period');
  }
  return result;
};

export const testPeriodDayjs = (d1: string, d2: string, subjects?: PeriodSubject | readonly PeriodSubject[]) => {
  return testPeriod(dayjs(d1) as unknown as DayjsLike, dayjs(d2) as unknown as DayjsLike, subjects);
};

// A custom comparable type. Its compareTo() returns other values than -1, 0 and 1, which Comparable normalizes.
export const Version = (value: number) => ({
  value,
  compareTo: (other: { value: number }) => (value - other.value) * 10,
  diff: (other: { value: number }) => value - other.value,
  toString: () => `v${value}`,
});

// A type with compareTo() but without diff(), which is not a CustomComparable
export const Rank = (value: number) => ({
  value,
  compareTo: (other: { value: number }) => value - other.value,
});

// Helper function for comparing periods
export const periodEqualsPeriod = (p1: IPeriod, p2: IPeriod): void => {
  // Use internal accessors for testing deep equality
  expect(p1._getStart().source).toEqual(p2._getStart().source);
  expect(p1._getEnd().source).toEqual(p2._getEnd().source);
  expect(p1.subjects).toEqual(p2.subjects);
  expect(p1.isEmpty()).toBe(false);
};

// Helper function for comparing two PeriodLike
export const periodEq = (p1: PeriodLike, p2: PeriodLike): void => {
  if (isEmpty(p1)) {
    expect(isEmpty(p2)).toBe(true);
  } else {
    const periods = p1.periods();
    const otherPeriods = p2.periods();
    expect(periods.length).toBe(otherPeriods.length);
    periods.forEach((period, idx) => {
      const otherPeriod = otherPeriods[idx];
      periodEqualsPeriod(period, otherPeriod!);
    });
  }
};

// Helper function for verifying PeriodSeq results
export const periodSeqEq = (actual: PeriodLike, expectedPeriods: readonly (readonly ComparableValue[])[]): void => {
  expect(isPeriodSeq(actual)).toBe(true);
  expect(actual.periods().length).toBe(expectedPeriods.length);
  expectedPeriods.forEach((expected, index) => {
    periodEq(actual.periods()[index]!, Period(expected[0]!, expected[1]!));
  });
};
