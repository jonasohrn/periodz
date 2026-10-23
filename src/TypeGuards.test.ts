import { describe, it, expect } from 'vitest';
import {
  Period, 
  PeriodSeq, 
  isPeriod,
  isPeriodSeq, 
  isEmpty, 
} from './index.js';
import { periodEq } from './testHelpers.js';

describe('Type Guards', () => {
  describe('isPeriod', () => {
    it('should correctly identify Period objects', () => {
      const period = Period(10, 20);
      expect(isPeriod(period)).toBe(true);
    });

    it('should return false for PeriodSeq', () => {
      const seq = PeriodSeq([Period(10, 20), Period(30, 40)]);
      expect(isPeriod(seq)).toBe(false);
    });

    it('should return false for empty periods', () => {
      const empty = Period(10, 10);
      expect(isPeriod(empty)).toBe(false);
    });
  });

  describe('isPeriodSeq', () => {
    it('should correctly identify PeriodSeq objects', () => {
      const seq = PeriodSeq([Period(10, 20), Period(30, 40)]);
      expect(isPeriodSeq(seq)).toBe(true);
    });

    it('should return false for Period', () => {
      const period = Period(10, 20);
      expect(isPeriodSeq(period)).toBe(false);
    });

    it('should return false for empty periods', () => {
      const empty = Period(10, 10);
      expect(isPeriodSeq(empty)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should correctly identify empty periods', () => {
      const empty = Period(10, 10);
      expect(isEmpty(empty)).toBe(true);
    });

    it('should return false for non-empty Period', () => {
      const period = Period(10, 20);
      expect(isEmpty(period)).toBe(false);
    });

    it('should return false for non-empty PeriodSeq', () => {
      const seq = PeriodSeq([Period(10, 20), Period(30, 40)]);
      expect(isEmpty(seq)).toBe(false);
    });

    it('should identify empty PeriodSeq', () => {
      const seq = PeriodSeq([]);
      expect(isEmpty(seq)).toBe(true);
    });
  });

  describe('Type narrowing in conditional blocks', () => {
    it('should narrow types correctly in if blocks', () => {
      const periodLike = Period(10, 20);
      
      if (isPeriod(periodLike)) {
        // TypeScript should know this is a Period
        periodEq(periodLike, Period(10, 20));
        expect(periodLike.kind).toBe('Period');
      } else {
        throw new Error('Should be identified as Period');
      }
    });

  });
});