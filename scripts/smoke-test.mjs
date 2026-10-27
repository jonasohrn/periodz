// Smoke test of the built package on the oldest supported Node versions, where Vitest can't run.
// Run `npm run build` first. The import resolves to dist/ through the package's own exports.
import assert from 'node:assert/strict';
import { Period, PeriodSeq, PeriodzError, isEmpty, isPeriod, isPeriodSeq, theEmptyPeriod } from 'periodz';

const Version = (v) => ({ v, compareTo: (other) => v - other.v, diff: (other) => v - other.v });

const check = (mk) => {
  const P = (start, end) => Period(mk(start), mk(end));
  const a = Period(mk(1), mk(10), 'alice');
  const b = Period(mk(5), mk(15), 'bob');
  const seq = PeriodSeq([P(20, 30), a, theEmptyPeriod]);

  assert.ok(a.intersection(b).eq(P(5, 10)));
  assert.ok(a.union(b).eq(P(1, 15)));
  assert.ok(a.subtract(b).eq(P(1, 5)));
  assert.deepEqual(a.mix(b).periods().map((p) => p.subjects), [['alice'], ['alice', 'bob'], ['bob']]);
  assert.ok(seq.union(b).eq(PeriodSeq([P(1, 15), P(20, 30)])));
  assert.ok(seq.subtract(b).eq(PeriodSeq([P(1, 5), P(20, 30)])));
  assert.ok(seq.span().subtract(seq).eq(P(10, 20)));
  assert.ok(isEmpty(a.intersection(P(20, 30))));
  assert.ok(a.overlaps(b) && !a.touches(b) && P(1, 20).contains(a) && P(10, 12).touches(a));
  assert.ok(seq.existsAt(mk(7)) && !seq.existsAt(mk(15)));
  assert.deepEqual(seq.periodsAt(mk(7)).map((p) => p.subjects), [['alice']]);
  assert.ok(isPeriod(a) && isPeriodSeq(seq) && seq.periods().length === 2);
};

check((n) => n);
check((n) => new Date(Date.UTC(2026, 0, n)));
check(Version);

// propsMerger is the only caller of Object.hasOwn, which sets the Node 16.9 minimum
const merger = (_source, other, subjects) => ({ label: subjects.join('+') + (other ? ' merged' : '') });
assert.equal(Period(1, 10, 'alice', merger).intersection(Period(5, 15, 'bob', merger)).label, 'alice+bob merged');

assert.throws(() => Period(1, new Date(0)), PeriodzError);

console.log(`Smoke test passed on Node ${process.versions.node}`);
