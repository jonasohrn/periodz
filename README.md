# Periodz

[![npm](https://img.shields.io/npm/v/periodz)](https://www.npmjs.com/package/periodz)
[![CI](https://github.com/jonasohrn/periodz/actions/workflows/ci.yml/badge.svg)](https://github.com/jonasohrn/periodz/actions/workflows/ci.yml)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fjonasohrn%2Fperiodz%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/jonasohrn/periodz/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Period and interval arithmetic — a TypeScript library for set operations on closed intervals, using numbers, JavaScript `Date` objects, Day.js objects, or any type with `compareTo()` and `diff()` methods.

## Why periodz?

- **Every result has the same shape.** Each operation returns empty, one period or many, all with the same methods. You never get a `null` or an exception, and you never need to branch on the kind of result. Chain as many operations as you like and read the answer with `periods()`.
- **Results tell you whose they are.** Tag periods with subjects such as people, rooms or statuses, and every operation passes them on to the result periods.
- **Bring your own values.** Use numbers, `Date`, Day.js, or wrap Temporal, Luxon, Chronera or anything else that can be compared. No converting to timestamps and back.

```typescript
const staffed = Period(9, 12, 'Alice').mix(Period(11, 15, 'Bob'));
staffed.periods().map(p => `${p.start}–${p.end} ${p.subjects.join('+')}`);
// ['9–11 Alice', '11–12 Alice+Bob', '12–15 Bob']
```

## Features

- **Chain without checking**: Chain as many operations as you like and read the result with `periods()`. Every operation returns empty, one period or many, all with the same methods, so you never need to check which kind you got unless you want to. This is known as [closure of operations](#closure-of-operations-one-result-type-periodlike)
- **Type flexibility**: Works with numbers, JavaScript Date objects (so date-fns as is), Day.js objects, and any type with `compareTo()` and `diff()` methods, such as wrapped Temporal, Luxon, Chronera or Moment values (operations must use compatible types)
- **Immutable design**: All operations return new objects rather than modifying existing ones
- **Empty period handling**: Graceful handling of empty/invalid periods
- **Subject tracking**: Periods can carry metadata about their "owners" or subjects
- **100% test coverage**: 100% actual (not execution) test coverage measured as [mutation test](https://en.wikipedia.org/wiki/Mutation_testing) coverage using [Stryker Mutator](https://stryker-mutator.io/). See also [MUTATION_TESTING](docs/MUTATION_TESTING.md).

## Installation

```bash
npm install periodz
```

Periodz is an ES module with its own TypeScript types and no runtime dependencies. It runs in Node.js 22 or
later, and in browsers through any modern bundler.

## Usage

Periodz implements mathematical [set operations](https://en.wikipedia.org/wiki/Set_(mathematics)#Basic_operations) on closed [intervals](https://en.wikipedia.org/wiki/Interval_(mathematics)).
You create a period from a start and an end value, both included. The values can be numbers, `Date` objects, Day.js objects
or any type with `compareTo()` and `diff()` methods, as long as all periods in an operation use the same type.
Used to periods that exclude the end? See [Coming from half-open periods](#coming-from-half-open-periods).

### Coming from half-open periods

Many libraries exclude the end of a period (`[start, end)`), so that 9–12 and 12–15 meet without overlapping. Periodz
includes both ends, but a period always has a length, so you can write periods exactly the way you are used to:

- `Period(5, 5)` is empty, not a single point
- `Period(9, 12)` and `Period(12, 15)` touch but don't overlap, their intersection is empty and their union is `9–15`
- `length()` is `end - start`, so `Period(9, 12).length()` is 3
- `subtract()` gives `8–9` and `10–17` for `Period(8, 17).subtract(Period(9, 10))`

The end only makes a difference when you look up a single value. `Period(9, 12).existsAt(12)` is `true`, and
`periodsAt(12)` returns both 9–12 and 12–15.

Write the end as the moment the period is over, not as its last day. January is
`Period(new Date('2026-01-01'), new Date('2026-02-01'))`. `Period(new Date('2026-01-01'), new Date('2026-01-31'))`
ends at midnight when January 31 starts, so it leaves out that day, `length()` is one day short, and it doesn't touch a
period starting on February 1.

### Closure of operations: one result type, `PeriodLike`

`intersection()`, `union()`, `subtract()` and `mix()` take any `PeriodLike` and return a `PeriodLike`: the empty period, a single `Period` or a `PeriodSeq` of two or more periods, whichever fits the result. The set of values is closed under these operations, the same way integers are closed under addition, so you can chain operations indefinitely without ever leaving the type. All three kinds share the same interface, so intermediate results never need special handling. An operation that leaves nothing behind returns the empty period instead of throwing or returning `null`, and you can keep chaining operations on it.

```typescript
import { Period, PeriodSeq } from 'periodz';

const workday = Period(8, 17);
const meetings = PeriodSeq([Period(9, 10), Period(13, 14)]);

const free = workday.subtract(meetings);           // three periods
const focus = free.intersection(Period(10, 12));   // one period
const overtime = free.intersection(Period(18, 20)); // empty

// The same code handles every result, whatever its kind
for (const result of [free, focus, overtime]) {
  console.log(result.periods().length, result.length()); // 3 7, 1 2, 0 0
}
```

At the end you just get any number of periods from `periods()`. If you do need to know the kind, use `isEmpty()`, `isPeriod()` and `isPeriodSeq()`, or check the `kind` property. Since the kind follows from the number of periods, `isPeriod(free)` tells you whether the free time is a single block.

This is the pattern Eric Evans calls *Closure of Operations* in *Domain-Driven Design*: a value object whose operations return values of the same type. It also comes from algebra. Periods form something close to a [Boolean algebra of sets](https://en.wikipedia.org/wiki/Algebra_of_sets): `union()` and `intersection()` are commutative, associative and distributive over each other, the empty period is the identity for `union()`, and `subtract()` plays the role of relative complement. It is not a full Boolean algebra, because there is no "everything" period to take a complement against, and because intervals are closed, `subtract()` keeps the shared boundary points (`Period(8, 17).subtract(Period(9, 10))` gives `8–9` and `10–17`).

### Period Operations

```typescript
import { Period, PeriodSeq } from 'periodz';

// Create periods - can be single intervals or sequences
const period1 = Period(10, 20);
const period2 = Period(15, 25);
const sequence = PeriodSeq([Period(5, 10), Period(30, 40)]);

// Set operations work transparently across all types
const intersection = period1.intersection(period2); // Overlapping part
const union = period1.union(sequence); // Combined coverage
const subtract = sequence.subtract(period1); // Remaining parts

// Operations chain naturally without type concerns
const result = period1
  .union(period2)
  .intersection(PeriodSeq([Period(12, 30)]))
  .subtract(Period(18, 22));
```

#### Special operations

mix() - mixes periods so that the resulting array contains all unique overlapping periods.

span() - the period from the first start to the last end, which also covers the gaps between the periods. It has no
subjects, since no period covers the gaps. Subtract the periods from it to get the gaps, which have no subjects either:

```typescript
const bookings = PeriodSeq([Period(9, 10), Period(12, 13), Period(13, 15)]);
bookings.span(); // Period(9, 15)
bookings.span().subtract(bookings); // Period(10, 12), the touching 12–13 and 13–15 leave no gap
```

The gaps share their start and end with the periods next to them, since periods are closed. To get the free time within
a window instead, subtract the periods from the window: `Period(8, 17).subtract(bookings)`.

### Equality and Comparison Operations

```typescript
// Equality testing
const p1 = Period(10, 20);
const p2 = Period(10, 20);
const seq = PeriodSeq([Period(10, 15), Period(15, 20)]);

console.log(p1.eq(p2)); // true - same interval
console.log(p1.eq(seq)); // false - other periods, though they cover the same values
console.log(p1.eq(Period(5, 5))); // false - compared to empty period

// Overlap detection
const a = Period(10, 20);
const b = Period(15, 25);
const c = Period(20, 30);
const d = PeriodSeq([Period(5, 12), Period(18, 22)]);

console.log(a.overlaps(b)); // true - partial overlap
console.log(a.overlaps(c)); // false - touching but not overlapping
console.log(a.overlaps(d)); // true - overlaps with sequence parts

// Containment testing
const container = Period(10, 30);
const contained = Period(15, 20);
const partial = Period(25, 35);
const multiPeriod = PeriodSeq([Period(12, 18), Period(22, 28)]);

console.log(container.contains(contained)); // true - fully inside
console.log(container.contains(partial)); // false - extends beyond
console.log(container.contains(multiPeriod)); // true - all parts contained
console.log(container.contains(Period(5, 5))); // false - empty periods never contained

const touching = PeriodSeq([Period(10, 20), Period(20, 30)]);
console.log(touching.contains(Period(15, 25))); // true - touching periods contain together
```

### Working with Different Value Types

```typescript
// Create periods with different value types
const numericPeriod = Period(10, 20);
const datePeriod = Period(new Date('2023-01-01'), new Date('2023-02-01'));
const dayjsPeriod = Period(dayjs('2023-01-01'), dayjs('2023-02-01'));

// Operations work within the same type
const numericUnion = numericPeriod.union(Period(15, 25)); // ✅ Numbers with numbers
const dateIntersection = datePeriod.intersection(
  Period(new Date('2023-01-15'), new Date('2023-01-20'))
); // ✅ Dates with dates

// Mixed-type operations will throw errors
// const mixedUnion = numericPeriod.union(datePeriod); // ❌ Throws PeriodzError

// Check temporal relationships within same type
console.log(datePeriod.existsAt(new Date('2023-01-15'))); // true
console.log(numericPeriod.existsAt(15)); // true
console.log(dayjsPeriod.existsAt(dayjs('2023-01-15'))); // true
```

Any other type works if it has a `compareTo()` method that returns a negative number, zero or a
positive number, like Java's `Comparable`, and a `diff()` method that returns the distance used
by `length()`:

```typescript
const Version = (major: number) => {
  const diff = (other: { major: number }) => major - other.major;
  return { major, compareTo: diff, diff };
};

const supported = Period(Version(2), Version(5));
console.log(supported.existsAt(Version(3))); // true
```

Using Temporal, Luxon, Chronera, date-fns, Moment, or another date library? See
[Using Temporal, Luxon, Chronera, date-fns and Moment with Periodz](docs/date-like-adapters.md).

### Subjects and propsMerger

A period can carry subjects, such as the employees or statuses it belongs to. Operations merge the
subjects: `intersection()`, `union()` and `mix()` give a result period the subjects of both periods,
and `subtract()` keeps the subjects of the remaining parts.

The optional fourth argument, `propsMerger`, adds your own properties to a period. It is called with
`(sourcePeriod, otherPeriod, subjects)`, where `subjects` belong to the period the props are added to.
For an `intersection()` or `union()` result, these are the subjects of both `sourcePeriod` and `otherPeriod`. The object
it returns is added to the period, but it never replaces the period's own members. It is passed on to every result period of an operation, so the
results get the props too. A period without a propsMerger uses the one of the other period.

```typescript
const severity = { ok: 0, down: 1 };

// The most severe status of the subjects of the period
const statusMerger = (_sourcePeriod, _otherPeriod, subjects) => {
  const status = subjects.reduce((worst, s) => (severity[s] > severity[worst] ? s : worst));
  return { getStatus: () => status };
};

const day = Period(0, 24, 'ok', statusMerger).mix(Period(9, 11, 'down', statusMerger));
// getStatus() is not part of IPeriod, so TypeScript needs a cast
day.periods().map(p => (p as IPeriod & { getStatus(): string }).getStatus()); // ['ok', 'down', 'ok']
```

See the [status bar example](docs/examples/status-bar/status-bar.md) for a complete example.

## Architecture

### Core Components

- **`Period`**: Represents a time interval with start and end points
- **`PeriodSeq`**: Represents a sequence of non-overlapping periods
- **`IComparable`**: Internal wrapper providing comparison operations for different value types

### Key Abstractions

- **Immutable operations**: All mutator methods return new instances
- **Type safety**: Strong TypeScript typing with proper type guards
- **Subject handling**: Periods can carry metadata through operations
- **Empty period management**: Automatic filtering and handling of invalid periods

## Internal members

`IPeriod` has `_getStart()` and `_getEnd()` methods, which periodz uses internally. They are not part of the
public API and may change in any release. Use `start` and `end` to read the start and end of a period.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up, test and release periodz.

## License

MIT