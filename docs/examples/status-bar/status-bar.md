# Status Bar with Periodz

This example builds a service status bar for one day (hours 0–24) from overlapping incidents. Each
segment of the bar knows its own status, and that status is derived from the segment's subjects by
a propsMerger.

Run it with:

```bash
npm run example:status-bar
```

## StatusPeriod

A `StatusPeriod` is a plain `Period` with a status as its subject and a propsMerger that adds a
`getStatus()` method:

```typescript
const statusMerger: PropsMerger = (_sourcePeriod, _otherPeriod, subjects) => {
  const status = (subjects as Status[]).reduce((worst, s) => (severity[s] > severity[worst] ? s : worst));
  return { getStatus: () => status };
};

const StatusPeriod = (start: number, end: number, status: Status) => Period(start, end, status, statusMerger);
```

The propsMerger is passed on to every result period of `intersection()`, `union()`, `subtract()`
and `mix()`, so every result has a `getStatus()` too. The third argument, `subjects`, holds the
subjects of the period the props are added to, which for an `intersection()` or `union()` result
are those of both periods. So the status always matches the subjects of the period.

## Building the bar

`mix()` splits overlapping periods into segments. Each segment has the subjects of all the periods
that cover it:

```typescript
const day = StatusPeriod(0, 24, 'ok')
  .mix(StatusPeriod(6, 14, 'degraded'))
  .mix(StatusPeriod(9, 11, 'down'))
  .mix(StatusPeriod(18, 20, 'down'));
```

```
Segments:
  (0, 6)     ok        ok
  (6, 9)     degraded  ok, degraded
  (9, 11)    down      ok, degraded, down
  (11, 14)   degraded  ok, degraded
  (14, 18)   ok        ok
  (18, 20)   down      ok, down
  (20, 24)   ok        ok
```

The example then draws one colored block per hour: green for `ok`, yellow for `degraded` and red
for `down`:

0h 🟩🟩🟩🟩🟩🟩🟨🟨🟨🟥🟥🟨🟨🟨🟩🟩🟩🟩🟥🟥🟩🟩🟩🟩 24h

## Other operations

- `union()` merges the subjects, so the union of the whole day gives its worst status: `down`
- `subtract()` keeps the subjects of each remaining part, so cutting out a maintenance window from
  12h to 16h leaves `(11, 12) degraded` and `(16, 18) ok`, with a gap where the window was:

  0h 🟩🟩🟩🟩🟩🟩🟨🟨🟨🟥🟥🟨⬜⬜⬜⬜🟩🟩🟥🟥🟩🟩🟩🟩 24h

## Typing

`getStatus()` is not part of `IPeriod`, so the example declares
`type StatusPeriod = IPeriod & { getStatus(): Status }` and casts the results of `periods()` to it.
