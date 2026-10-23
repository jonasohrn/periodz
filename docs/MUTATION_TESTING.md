# Mutation Testing and Performance Optimizations

This document explains our approach to handling performance optimizations in mutation testing with Stryker, and why certain mutations are acceptable to survive.

## Running Stryker

```bash
npm run test:mutation  # Incremental run: only retests mutants whose code or tests changed
npx stryker run        # Full run, as in CI
```

- `stryker.config.json` mutates all runtime code in `src/` and uses the TypeScript checker, so mutants that don't
  compile are reported as compile errors instead of being tested.
- `thresholds.break` is 100, so any survivor fails the run, both locally and in the `mutation.yml` CI workflow.
  CI uploads the HTML report as an artifact, and also sends it to the Stryker dashboard when the
  `STRYKER_DASHBOARD_API_KEY` secret is set.
- Stryker runs Vitest with `vitest.stryker.config.ts`, which leaves out `Performance.test.ts`, since timing tests
  are unreliable when many Stryker workers run at once.
- Vitest stays on 4.x for now: with Vitest 5, Stryker's per-test filter matches no tests, so almost every mutant
  survives ([stryker-js#6210](https://github.com/stryker-mutator/stryker-js/issues/6210)). TypeScript stays on 6.0.x,
  since Stryker can't read the tsconfig with TypeScript 7
  ([stryker-js#6111](https://github.com/stryker-mutator/stryker-js/issues/6111)). After upgrading either one, run a
  full `npx stryker run`, not just `npm test`.

## Overview

Mutation testing is a powerful technique for evaluating test suite quality by introducing small changes (mutations) to the code and checking if tests catch these changes. However, performance optimizations present a unique challenge because:

1. **Correctness vs Performance**: Optimization code prioritizes performance while maintaining correctness
2. **Hard to Test**: Optimization paths are often difficult to test directly without artificial scenarios
3. **Acceptable Mutations**: Some mutations in optimization code produce correct results, just slower

## Our Strategy

We use a three-pronged approach to handle optimization code in mutation testing:

### 1. Stryker Ignore Comments

We explicitly disable mutations for optimization code using Stryker comments:

```typescript
// Other periods that end before this period starts can't overlap it, nor any period after it
// Stryker disable next-line all: Performance optimization
while (endsBy(otherPeriods[first], period._getStart())) {
  first++;
}
```

### 2. Performance Tests

We create dedicated performance tests that verify optimizations work under load using Fibonacci sequence baselines for machine-independent performance measurement:

```typescript
it('should use early exit optimization for disjoint sequences', () => {
  // Establish performance baseline using Fibonacci calculation
  const baseline = getFibonacciBaseline(10000);
  
  const startTime = performance.now();
  // Test with large datasets that exercise optimization
  const endTime = performance.now();
  
  const executionTime = endTime - startTime;
  const performanceRatio = getPerformanceRatio(executionTime, baseline.time);
  expect(performanceRatio).toBeLessThan(10); // Should be max 10 times baseline
});
```

### 3. Documentation

We document why optimization mutations are acceptable to survive.

## Fibonacci Baseline Performance Testing

To ensure machine-independent performance testing, we use Fibonacci sequence calculations as performance baselines. This approach provides several benefits:

### Benefits of Baselines

1. **Machine Independence**: Fibonacci calculations provide consistent computational complexity across different hardware
2. **Relative Measurement**: Performance ratios (operation_time / baseline_time) are more meaningful than absolute thresholds

## Optimization Categories

### Intersection Algorithm Optimizations

**Location**: `src/PeriodSeq.ts` `intersection()` and `subtract()`

**Skip Optimization**:
- **Purpose**: Skip the other periods that end at or before the current period starts (`endsBy()`). They can't overlap it, nor any later period
- **Impact**: O(n×m) → O(n+m) for sequences that overlap little
- **Mutation Survival**: Acceptable because skipping fewer periods still produces a correct result, just slower

**Break Loop Optimization**:
- **Purpose**: Break the inner loop when `period._getEnd().lte(otherPeriod._getStart())`
- **Impact**: Stops at the first other period that starts after the current period ends
- **Mutation Survival**: Acceptable because an incorrect break just means more iterations

### Memory Optimizations

**Empty Result Filtering**:
- **Purpose**: Avoid adding empty periods to result arrays
- **Impact**: Reduced memory usage and better cache performance
- **Mutation Survival**: Acceptable because empty periods are filtered later anyway

**Early Return Optimizations**:
- **Purpose**: Skip unnecessary work when a result is predetermined
- **Impact**: Constant time improvement for edge cases
- **Mutation Survival**: Acceptable because full algorithm still produces a correct result

## Acceptable Mutation Criteria

We consider a mutation acceptable to survive if:

1. **Correctness Preserved**: The mutated code still produces mathematically correct results
2. **Performance Only**: The mutation only affects performance, not functionality
3. **Difficult to Test**: Testing the mutation would require artificial scenarios
4. **Documentation Exists**: The optimization is properly documented with rationale

For survivors we have added comment to disable mutants at these points in code this way: 

```typescript
// Stryker disable next-line all: Performance optimization - empty periods have no overlap
if (other.isEmpty()) {
  return false;
}
```

## Verification

We verify our optimizations through:

1. **Performance Tests**: Measure execution time improvements using Fibonacci sequence baselines for machine-independent comparison
2. **Correctness Tests**: Ensure optimized code produces same results as unoptimized
3. **Edge Case Tests**: Test boundary conditions where optimizations trigger
4. **Load Tests**: Verify optimizations work with large datasets
5. **Baseline Validation**: Ensure Fibonacci baseline calculations are consistent and reliable

## Trade-offs

### Benefits:
- ✅ Reduced false positives from optimization code
- ✅ Focused mutation testing on business logic
- ✅ Performance improvements verified through tests
- ✅ Clear documentation for team understanding
- ✅ 100% mutation coverage with "stryker disable" comments

### Costs:
- ❌ Additional test maintenance for performance tests
- ❌ More complex codebase with optimization annotations

## Examples of Unacceptable Mutations

Not all mutations in performance code should survive. Mutations that **should be caught** include:

- Logic errors that affect correctness
- Boundary condition mistakes that cause infinite loops
- Type errors or null pointer exceptions
- Off-by-one errors in loop conditions

## Conclusion

Our approach to mutation testing balances comprehensive test coverage with practical recognition that performance optimizations require different treatment than business logic. 
By using Stryker ignore comments, performance tests, and thorough documentation, we maintain high code quality while avoiding false positives from optimization code.
