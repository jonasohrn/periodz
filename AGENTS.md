# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Periodz is a TypeScript library for interval/period arithmetic (set arithmetic) on
numbers, JavaScript `Date` objects, and Day.js objects. It lets you create periods
and ordered sequences of non-overlapping periods, compare them, and combine them
using operations like intersection, union, and subtraction. Start and end values
are normalized through the internal `Comparable` abstraction, so period operations
work uniformly across the supported value types.

### The Periodz library provides:
- Period: Represents time intervals with start/end points
- PeriodSeq: Represents sequences of non-overlapping periods
- Subjects: Metadata that can be attached to periods (like employee names)
- Operations: intersection, union, subtract, contains, overlaps, touches, etc.


## Development Commands

- **Run all checks** (type-check, lint, test): `npm run check`
- **Run tests**: `npm test`
- **Run tests in DEV mode**: `npm run test:watch`
- **Run mutation tests**: `npm run test:mutation` (incremental) or `npx stryker run` (full, as in CI)
- **Build**: `npm run build` (tsup), then `npm run check:package` (publint and attw)
- **Test runner**: Uses vitest
- **Version holds**: TypeScript stays on 6.0.x and Vitest on 4.x until Stryker supports TypeScript 7 (stryker-js#6111) and Vitest 5 (stryker-js#6210). See `docs/MUTATION_TESTING.md`

## Architecture

### Core Components

- **`src/Period.ts`**: Main module for Period containing all period arithmetic functionality
- **`src/PeriodSeq.ts`**: Main module for PeriodSeq containing all period sequences arithmetic functionality

### Key Abstractions

1. **IComparable**: A wrapper that provides comparison operations for the comparable start- and end sources that constitutes a Period such as number and Date objects.
   - Supports `compareTo()`, `eq()`, `lt()`, `gt()`, `min()`, `max()`, `diff()` operations
   - Handles four types: numbers, Day.js objects, Date objects, and custom objects with `compareTo()` and `diff()` methods. Custom objects can be compared with any other custom object, but not with the built-in types, and are not frozen

2. **Period**: Represents a time interval with start and end points
   - Supports intersection, union, subtraction, and containment operations
   - Can have associated subjects (metadata)
   - Empty periods are represented by a singleton `theEmptyPeriod`

3. **PeriodSeq**: Represents a sequence of non-overlapping periods
   - Automatically filters empty periods and sorts by start time
   - Supports bulk operations on multiple periods
   - Optimized intersection algorithm for performance

### Key Features

- **Type flexibility**: Works with numbers, JavaScript Date objects, and Day.js objects
- **Immutable design**: All operations return new objects rather than modifying existing ones
- **Empty period handling**: Graceful handling of empty/invalid periods
- **Subject tracking**: Periods can carry metadata about their "owners" or subjects
- **Performance optimizations**: Includes optimized algorithms for sequence operations

## Module System

- Uses ES6 modules (`"type": "module"` in package.json)
- Exports `Period` and `PeriodSeq` as named exports
- Dependencies: Day.js for date/time handling in tests only

## Testing

- Test files use `*.test.ts` naming convention
- Tests cover all supported (ComparableValue) data types (numbers, Date objects, Day.js objects, custom `compareTo()` types via `Version` and `Rank` in `src/testHelpers.ts`)
- Comprehensive coverage of period operations and edge cases
- Uses custom `periodEq` and `periodSeqEq` helper for deep comparison testing
- Uses custom `testPeriod` helper for creating IPeriod objects in test that is required to be an IPeriod
- Shared test helpers live in `src/testHelpers.ts`. Never import helpers from a `*.test.ts` file, because that re-runs its describe-blocks in the importing file
- `Period.test.ts` and `PeriodSeq.test.ts` have one `describe('<op>()')` block per operation, in the same order: factory, `propsMerger` (Period only; cross-operation propsMerger behaviour), accessors (`isEmpty`, `periods`, `length`), predicates (`eq`, `overlaps`, `touches`, `contains`, `existsAt`, `periodsAt`), set operations (`intersection`, `union`, `subtract`, `mix`), `toString`. Within a block, cases go in this order: `with Period`, `with PeriodSeq`, `with empty period`, special cases, subjects, propsMerger
