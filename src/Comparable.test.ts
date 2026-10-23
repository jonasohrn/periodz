import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { Comparable } from './index.js';
import { PeriodzError } from './guards.js';
import { Rank, Version } from './testHelpers.js';

describe('IComparable', () => {
  describe('Comparison operations', () => {
    it('should handle exact equality comparisons', () => {
      const comp1 = Comparable(10);
      const comp2 = Comparable(20);
      
      // Test comparison operators with different values
      expect(comp1.lt(comp2)).toBe(true);
      expect(comp1.lte(comp2)).toBe(true);
      expect(comp2.gt(comp1)).toBe(true);
      expect(comp2.gte(comp1)).toBe(true);
      
      // Test exact equality on same values
      expect(comp1.eq(comp1)).toBe(true);
      expect(comp1.lte(comp1)).toBe(true);
      expect(comp1.gte(comp1)).toBe(true);
      expect(comp1.lt(comp1)).toBe(false);
      expect(comp1.gt(comp1)).toBe(false);
    });

    it('should handle floating point precision', () => {
      const val1 = 0.1;
      const val2 = 0.1 + 0.2; // 0.30000000000000004
      const comp1 = Comparable(val1);
      const comp2 = Comparable(val2);
      
      // Test floating point arithmetic
      expect(comp1.source).toBe(0.1);
      expect(comp2.source).toBeCloseTo(0.3);
      expect(comp1.lt(comp2)).toBe(true);
    });

    it('should handle large numbers', () => {
      const comp1 = Comparable(Number.MAX_SAFE_INTEGER - 1);
      const comp2 = Comparable(Number.MAX_SAFE_INTEGER);
      
      expect(comp1.lt(comp2)).toBe(true);
      expect(comp1.diff(comp2)).toBe(-1);
    });

    it('should handle Comparable as source', () => {
      const compSource = Comparable(10);
      const comp2 = Comparable(compSource);

      expect(comp2.eq(compSource)).toBe(true);
      expect(comp2.diff(compSource)).toBe(0);
    });

    it('should handle Date edge cases', () => {
      const date1 = new Date('2019-01-01T00:00:00.000Z');
      const date2 = new Date('2019-01-01T00:00:00.001Z'); // 1ms difference
      const comp1 = Comparable(date1);
      const comp2 = Comparable(date2);
      
      expect(comp1.diff(comp2)).toBe(-1);
      expect(comp1.lt(comp2)).toBe(true);
    });

    it('should handle custom comparable objects', () => {
      const comp1 = Comparable(Version(1));
      const comp2 = Comparable(Version(2));

      expect(comp1.lt(comp2)).toBe(true);
      expect(comp2.gt(comp1)).toBe(true);
      expect(comp1.eq(Comparable(Version(1)))).toBe(true);
      expect(comp1.eq(comp2)).toBe(false);
    });

    it('should accept any object with compareTo() and diff() methods', () => {
      const plain = { value: 1, compareTo: (other: { value: number }) => 1 - other.value, diff: () => 0 };
      expect(Comparable(plain).eq(Comparable({ ...plain, value: 1 }))).toBe(true);
      expect(Comparable(plain).eq(Comparable(Version(1)))).toBe(true);
    });
  });

  describe('Arithmetic operations', () => {
    it('should handle min and max operations', () => {
      const comp1 = Comparable(5);
      const comp2 = Comparable(15);
      
      expect(comp1.min(comp2)).toBe(comp1);
      expect(comp1.max(comp2)).toBe(comp2);
      expect(comp2.min(comp1)).toBe(comp1);
      expect(comp2.max(comp1)).toBe(comp2);
    });

    it('should handle diff operations correctly', () => {
      const comp1 = Comparable(10);
      const comp2 = Comparable(20);
      
      expect(comp1.diff(comp2)).toBe(-10);
      expect(comp2.diff(comp1)).toBe(10);
    });

    it('should handle compareTo method', () => {
      const comp1 = Comparable(10);
      const comp2 = Comparable(20);
      const comp3 = Comparable(10);
      
      expect(comp1.compareTo(comp2)).toBe(-1);
      expect(comp2.compareTo(comp1)).toBe(1);
      expect(comp1.compareTo(comp3)).toBe(0);
    });

    it('should normalize compareTo of custom comparable objects to -1, 0 and 1', () => {
      const comp1 = Comparable(Version(10));
      const comp2 = Comparable(Version(20));

      expect(comp1.compareTo(comp2)).toBe(-1);
      expect(comp2.compareTo(comp1)).toBe(1);
      expect(comp1.compareTo(Comparable(Version(10)))).toBe(0);
      expect(comp1.min(comp2)).toBe(comp1);
      expect(comp1.max(comp2)).toBe(comp2);
    });

    it('should use diff() of custom comparable objects', () => {
      expect(Comparable(Version(10)).diff(Comparable(Version(25)))).toBe(-15);
    });
  });

  describe('String representation', () => {
    it('should handle toString for different value types', () => {
      // Test number toString
      const numberComp = Comparable(10);
      expect(numberComp.toString()).toBe('10');

      const numberComp2 = Comparable(20);
      expect(numberComp2.toString()).toBe('20');

      // Test Date toString (should be ISO string)
      const dateComp1 = Comparable(new Date('2019-01-01'));
      const dateComp2 = Comparable(new Date('2019-01-02'));
      
      expect(dateComp1.toString()).toBe('2019-01-01T00:00:00.000Z');
      expect(dateComp2.toString()).toBe('2019-01-02T00:00:00.000Z');
    });

    it('should handle dayjs time formatting with hours/minutes', () => {
      const comp1 = Comparable(dayjs('2019-01-01T14:30:45'));
      const comp2 = Comparable(dayjs('2019-01-01T15:45:30'));

      // Test toString formatting for non-midnight times
      expect(comp1.toString()).toBe('2019-01-01 14:30:45');
      expect(comp2.toString()).toBe('2019-01-01 15:45:30');

      // Test midnight formatting (should omit time)
      const midnightComp1 = Comparable(dayjs('2019-01-01T00:00:00'));
      const midnightComp2 = Comparable(dayjs('2019-01-02T00:00:00'));

      expect(midnightComp1.toString()).toBe('2019-01-01');
      expect(midnightComp2.toString()).toBe('2019-01-02');
    });

    it('should use toString() of custom comparable objects', () => {
      expect(Comparable(Version(3)).toString()).toBe('v3');
    });
  });

  describe('Object properties', () => {

    it('should expose source property correctly', () => {
      const numberComp = Comparable(42);
      expect(numberComp.source).toBe(42);

      const date = new Date('2019-01-01');
      const dateComp = Comparable(date);
      expect(dateComp.source).toEqual(date);

      const dayjsValue = dayjs('2019-01-01');
      const dayjsComp = Comparable(dayjsValue);
      expect(dayjsComp.source).toEqual(dayjsValue);
    });

    it('should freeze built-in sources but not custom comparable objects', () => {
      expect(Object.isFrozen(Comparable(new Date('2019-01-01')).source)).toBe(true);

      const version = Version(1);
      expect(Comparable(version).source).toBe(version);
      expect(Object.isFrozen(version)).toBe(false);
    });
  });

  describe('Type-specific behavior', () => {
    it('should handle number-specific operations', () => {
      const num1 = Comparable(100);
      const num2 = Comparable(200);
      
      expect(num1.diff(num2)).toBe(-100);
      expect(num1.lt(num2)).toBe(true);
      expect(num1.toString()).toBe('100');
    });

    it('should handle Date-specific operations', () => {
      const date1 = new Date('2019-01-01T10:00:00');
      const date2 = new Date('2019-01-01T12:00:00');
      const comp1 = Comparable(date1);
      const comp2 = Comparable(date2);
      
      // 2 hours difference in milliseconds
      expect(comp1.diff(comp2)).toBe(-2 * 60 * 60 * 1000);
      expect(comp1.lt(comp2)).toBe(true);
    });

    it('should handle dayjs-specific operations', () => {
      const dayjs1 = dayjs('2019-01-01T10:00:00');
      const dayjs2 = dayjs('2019-01-01T12:00:00');
      const comp1 = Comparable(dayjs1);
      const comp2 = Comparable(dayjs2);
      
      // 2 hours difference in milliseconds
      expect(comp1.diff(comp2)).toBe(-2 * 60 * 60 * 1000);
      expect(comp1.lt(comp2)).toBe(true);
    });
  });

  describe('Error handling', () => {
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
      expect(() => Comparable({} as any)).toThrow(PeriodzError);
      expect(() => Comparable([] as any)).toThrow(PeriodzError);
      expect(() => Comparable({ compareTo: 1, diff: () => 0 } as any)).toThrow('Comparable: Unsupported source of type: object');
      expect(() => Comparable({ compareTo: () => 0, diff: 1 } as any)).toThrow('Comparable: Unsupported source of type: object');
      expect(() => Comparable(Rank(1) as any)).toThrow('Comparable: Unsupported source of type: object');
    });

    it('should throw error when mixing custom comparable objects with other types', () => {
      const version = Comparable(Version(1));
      const message = 'Cannot handle mixed types; custom and non-custom objects';

      expect(() => version.compareTo(Comparable(1))).toThrow(message);
      expect(() => version.compareTo(Comparable(new Date('2019-01-01')))).toThrow(message);
      expect(() => version.compareTo(Comparable(dayjs('2019-01-01')))).toThrow(message);
      expect(() => version.diff(Comparable(1))).toThrow(message);
      expect(() => Comparable(1).compareTo(version)).toThrow('Cannot handle mixed types; Number and non-Number objects');
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle boundary values correctly', () => {
      const maxSafe = Comparable(Number.MAX_SAFE_INTEGER);
      const minSafe = Comparable(Number.MIN_SAFE_INTEGER);
      
      expect(minSafe.lt(maxSafe)).toBe(true);
      expect(maxSafe.gt(minSafe)).toBe(true);
    });

    it('should handle zero and negative numbers', () => {
      const zero = Comparable(0);
      const negative = Comparable(-100);
      const positive = Comparable(100);
      
      expect(negative.lt(zero)).toBe(true);
      expect(zero.lt(positive)).toBe(true);
      expect(negative.lt(positive)).toBe(true);
      
      expect(negative.diff(positive)).toBe(-200);
      expect(positive.diff(negative)).toBe(200);
    });
  });
});