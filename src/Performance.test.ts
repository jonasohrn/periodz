import { beforeAll, describe, expect, it } from 'vitest';
import {
  Period,
  PeriodSeq,
} from './index.js';

/**
 * Performance baseline calculator using Fibonacci sequence
 * This provides a consistent computational baseline for relative performance measurement
 * across different machines and environments.
 *
 * Returns average time in ms
 */
const calculateFibonacciBaseline = (n: number, samples: number = 3): number => {
  let totalTime = 0;

  // Run multiple samples and average the time for stability
  for (let sample = 0; sample < samples; sample++) {
    const startTime = performance.now();
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    
    const endTime = performance.now();
    totalTime += (endTime - startTime);
  }
  
  return totalTime / samples;
};

/**
 * Calculate performance ratio relative to Fibonacci baseline
 * @param operationTime Time taken by the operation being tested
 * @param baselineTime Time taken by Fibonacci baseline
 * @returns Ratio of operation time to baseline time
 */
const getPerformanceRatio = (operationTime: number, baselineTime: number): number => {
  return operationTime / Math.max(baselineTime, 0.001); // Prevent division by zero
};

describe('Performance Optimizations', () => {

  let baseline: number;
  beforeAll(() => {
    baseline = calculateFibonacciBaseline(30000, 5); // Large baseline for complex operations
  });

  describe('Fibonacci baseline validation', () => {
    it('should provide reasonable long baseline measurements', () => {
      expect(baseline).toBeGreaterThan(0.1)
    });
    
    it('should handle performance ratio calculations correctly', () => {
      // Test ratio calculations
      expect(getPerformanceRatio(10, 5)).toBe(2.0);
      expect(getPerformanceRatio(5, 10)).toBe(0.5);
      expect(getPerformanceRatio(0, 0)).toBe(0); // Edge case with minimum denominator
      
      // Test with very small baseline (should use minimum)
      expect(getPerformanceRatio(1, 0.0001)).toBe(1000);
    });
  });

  describe('Intersection algorithm optimizations', () => {
    it('should use early exit optimization for disjoint sequences', () => {
      // This test exercises the skipping of other periods in PeriodSeq.intersection()
      // that end before the current period starts, here all of them

      // Verification with large datasets
      const largeSeq1 = PeriodSeq(Array.from({length: 100}, (_, i) => Period(i * 1000 + 10000, i * 1000 + 10100)));
      const largeSeq2 = PeriodSeq(Array.from({length: 50}, (_, i) => Period(i * 100, i * 100 + 50)));

      const largeStart = performance.now();
      const largeResult = largeSeq1.intersection(largeSeq2);
      const largeEnd = performance.now();
      
      expect(largeResult.isEmpty()).toBe(true);
      const largeRatio = getPerformanceRatio(largeEnd - largeStart, baseline);
      expect(largeRatio).toBeLessThan(20);
    });

    it('should use early exit optimization for overlapping sequences', () => {
      // This test exercises the skipping of other periods in PeriodSeq.intersection()
      // that end before the current period starts, or start after it ends,
      // but still contains many overlapping Periods

      // Verification with large datasets
      const largeSeq1 = PeriodSeq(Array.from({length: 100}, (_, i) => Period(i * 1000 + 10000, i * 1000 + 10100)));
      const largeSeq2 = PeriodSeq(Array.from({length: 100}, (_, i) =>  Period(i * 1337 +  5000, i * 1347 + 5000)));

      const largeStart = performance.now();
      const largeResult = largeSeq1.intersection(largeSeq2);
      const largeEnd = performance.now();

      expect(largeResult.isEmpty()).toBe(false);
      const largeRatio = getPerformanceRatio(largeEnd - largeStart, baseline);
      expect(largeRatio).toBeLessThan(150);
    });

    it('should intersect and subtract large interleaved sequences in linear time', () => {
      // Starting from the first other period for every period gave a ratio of ~6000 here, skipping ~100
      const seq1 = PeriodSeq(Array.from({length: 4000}, (_, i) => Period(i * 20, i * 20 + 10)));
      const seq2 = PeriodSeq(Array.from({length: 4000}, (_, i) => Period(i * 20 + 5, i * 20 + 15)));

      const startTime = performance.now();
      const intersection = seq1.intersection(seq2);
      const subtract = seq1.subtract(seq2);
      const endTime = performance.now();

      expect(intersection.periods().length).toBe(4000);
      expect(subtract.periods().length).toBe(4000);
      const performanceRatio = getPerformanceRatio(endTime - startTime, baseline);
      expect(performanceRatio).toBeLessThan(1000);
    });

  });

  describe('PeriodSeq factory optimizations', () => {
    it('should check for overlapping periods in linear time', () => {
      // Checking every pair of periods for overlaps gave a ratio of ~1600 here, checking neighbours ~20
      const periods = Array.from({length: 4000}, (_, i) => Period(i * 20, i * 20 + 10));

      const startTime = performance.now();
      const seq = PeriodSeq(periods);
      const endTime = performance.now();

      expect(seq.periods().length).toBe(4000);
      const performanceRatio = getPerformanceRatio(endTime - startTime, baseline);
      expect(performanceRatio).toBeLessThan(200);
    });
  });

  describe('Memory efficiency optimizations', () => {
    it('should handle large datasets efficiently', () => {
      // Test overall performance with larger datasets to ensure optimizations work together

      const size = 100;
      const seq1 = PeriodSeq(Array.from({length: size}, (_, i) => Period(i * 20, i * 20 + 10)));
      const seq2 = PeriodSeq(Array.from({length: size}, (_, i) => Period(i * 20 + 5, i * 20 + 15)));
      
      const startTime = performance.now();
      
      // Perform multiple operations that exercise different optimizations
      const intersection = seq1.intersection(seq2);
      const union = seq1.union(seq2);
      const subtract = seq1.subtract(seq2);
      
      const endTime = performance.now();
      
      // Verify operations completed correctly
      expect(intersection.periods().length).toBeGreaterThan(0);
      expect(union.periods().length).toBeGreaterThan(0);
      expect(subtract.periods().length).toBeGreaterThan(0);
      
      // All operations should complete in reasonable time relative to baseline
      const executionTime = endTime - startTime;
      const performanceRatio = getPerformanceRatio(executionTime, baseline);
      expect(performanceRatio).toBeLessThan(500);
    });
  });
});