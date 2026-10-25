# Using Temporal, Luxon, Chronera, date-fns and Moment with Periodz

Periodz supports numbers, `Date` and Day.js out of the box. It also accepts **any object with
`compareTo()` and `diff()` methods**, like Java's `Comparable`:

```ts
const Version = (major: number) => {
  const diff = (other: { major: number }) => major - other.major;
  return { major, compareTo: diff, diff }; // compareTo(): negative, zero or positive. diff(): the distance, used by length()
};

Period(Version(2), Version(5)).existsAt(Version(3)); // true
```

date-fns works on plain `Date` objects, so it needs no wrapper. That includes `TZDate` from
`@date-fns/tz`, a `Date` that does its date math in a time zone. See [date-fns](#date-fns) below.

Temporal, Luxon, Chronera and Moment values have no `compareTo()` or `diff()`, so you wrap them with a
small factory function. The wrapper is the start or end of the period, and it stays the same
object through every operation. Results of `intersection()`, `union()`, `subtract()` and `mix()`
contain your original values, time zone included.

The code below is a runnable example [`docs/examples/date-adapters/date-adapters.ts`](examples/date-adapters/date-adapters.ts).
To run it, use `npm install && npm start` in that folder.

## Wrappers

Temporal's `Instant` and `ZonedDateTime`, Luxon, Chronera and Moment all convert to epoch milliseconds, so
one factory covers them all. The original value is kept in `value`:

```ts
const MsPoint = <T>(value: T, ms: number) => {
  const diff = (other: { ms: number }) => ms - other.ms;
  return { value, ms, compareTo: diff, diff, toString: () => String(value) };
};
type MsPoint<T> = ReturnType<typeof MsPoint<T>>;

const TemporalPoint = (t: Temporal.Instant | Temporal.ZonedDateTime) => MsPoint(t, t.epochMilliseconds);
const LuxonPoint = (dt: DateTime) => MsPoint(dt, dt.toMillis());
const ChroneraPoint = (c: Chronera) => MsPoint(c, c.toInstant().epochMilliseconds); // A plain date becomes midnight UTC
const MomentPoint = (m: Moment) => MsPoint(m.clone(), m.valueOf()); // Moments are mutable
```

Because they all compare `ms`, points from different libraries combine with each other.
Moment is no longer developed, so the runnable example doesn't install it and shows
`MomentPoint` in comments only.

`Temporal.PlainDate` is a calendar date with no time zone, so it gets its own factory, and
`length()` returns days:

```ts
const DayPoint = (value: Temporal.PlainDate) => {
  const diff = (other: { value: Temporal.PlainDate }) => other.value.until(value).days;
  return { value, compareTo: diff, diff, toString: () => value.toString() };
};
```

Use the global `Temporal` where your runtime has it. Otherwise import it from
`@js-temporal/polyfill`.

## Usage

Pass wrapped values to `Period()`, `existsAt()` and `periodsAt()`. Read results through
`period.start` and `period.end`:

```ts
const zone = 'Europe/Stockholm';
const instant = (iso: string) => TemporalPoint(Temporal.Instant.from(iso));
const at = (time: string) => LuxonPoint(DateTime.fromISO(`2026-03-02T${time}`, { zone }));

// A booking from another system that uses Temporal, 15:00–16:00 in Stockholm
const booking = Period(instant('2026-03-02T14:00:00Z'), instant('2026-03-02T15:00:00Z'));

const workday = Period(at('08:00'), at('17:00'));
const meetings = PeriodSeq([Period(at('09:00'), at('10:00')), Period(at('13:00'), at('14:30'))]);

const free = workday.subtract(meetings).subtract(booking); // 08:00–09:00, 10:00–13:00, 14:30–15:00, 16:00–17:00

free.existsAt(at('11:00')); // true

for (const period of free.periods()) {
  const start = (period.start as MsPoint<Temporal.Instant | DateTime>).value; // The original Temporal.Instant or DateTime
}
```

Chronera values combine the same way:

```ts
// A call at 22:00–22:30 in Bangkok, which is 16:00–16:30 in Stockholm
const bangkok = (time: string) => ChroneraPoint(chronera(`2026-03-02T${time}[Asia/Bangkok]`));

free.subtract(Period(bangkok('22:00'), bangkok('22:30'))); // 08:00–09:00, 10:00–13:00, 14:30–15:00, 16:30–17:00
```

Calendar days with `DayPoint`:

```ts
const day = (iso: string) => DayPoint(Temporal.PlainDate.from(iso));

const vacation = Period(day('2026-06-22'), day('2026-07-13'));
const july = Period(day('2026-07-01'), day('2026-08-01'));

vacation.intersection(july).length(); // 12 (days)
```

## date-fns

Pass `Date` or `TZDate` values directly. Results contain your original values, so a `TZDate`
keeps its time zone:

```ts
const monday = new TZDate(2026, 2, 2, 'Europe/Stockholm');
const weekdays = eachDayOfInterval({ start: monday, end: addDays(monday, 4) });
const openingHours = PeriodSeq(weekdays.map((day) => Period(setHours(day, 9), setHours(day, 17))));
const closed = Period(new TZDate(2026, 2, 4, 12, 'Europe/Stockholm'), new TZDate(2026, 2, 5, 12, 'Europe/Stockholm'));

const open = openingHours.subtract(closed); // Mon 09–17, Tue 09–17, Wed 09–12, Thu 12–17, Fri 09–17
millisecondsToHours(open.length()); // 32, because length() of Dates is in milliseconds
```

## Rules

- **Don't mix with built-in types.** Combining a wrapper with a number, `Date` or Day.js value
  throws a `PeriodzError` such as `Cannot handle mixed types; custom and non-custom objects`. That includes
  Dates from date-fns. To combine them with wrapped values, wrap them too: `MsPoint(date, date.getTime())`.
- **Your `compareTo()` decides which custom objects it accepts.** Periodz passes any custom
  object to it. An `MsPoint` compared with a `DayPoint` finds no `ms` and gets `NaN`, so
  `overlaps()` quietly returns `false`. The other way round, `DayPoint` throws a `TypeError`.
  Keep points that don't understand each other apart.
- **`compareTo()` may return any number.** Periodz only uses its sign. If it returns `NaN`, for
  example for an invalid Luxon `DateTime` or Moment, `Period()` throws
  `start(...) and end(...) must be valid values`.
- **Add `toString()`.** `toString()` and the error messages of periods use it.
- **Periodz doesn't freeze your objects.** It freezes numbers, `Date` and Day.js values, but not
  custom ones.
- **Use calendar arithmetic for days.** Build the end of a day with `plus({ days: 1 })`,
  `add({ days: 1 })` or `addDays(date, 1)`, not by adding 24 hours. A local day can be 23 or 25 hours long when
  daylight saving time starts or ends.
- **Intervals are closed.** A period includes its start and end, so periods that end where the
  next one starts touch, and `union()` merges them.

## See also

- [Working with Subjects](subjects-guide.md)
- [Periodz README](../README.md)
