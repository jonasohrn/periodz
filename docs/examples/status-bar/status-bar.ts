/* eslint-disable no-console */
/**
 * Status Bar Example
 *
 * A service status bar for one day (hours 0-24). Each incident is a StatusPeriod: a Period whose
 * subject is a status. A propsMerger gives every period, also the result periods of operations,
 * a getStatus() that is derived from its subjects: the most severe status wins.
 */

import { Period, type IPeriod, type PropsMerger } from '../../../src/index.ts';

type Status = 'ok' | 'degraded' | 'down';

const severity: Record<Status, number> = { ok: 0, degraded: 1, down: 2 };
const color: Record<Status, string> = { ok: '\x1b[42m', degraded: '\x1b[43m', down: '\x1b[41m' };

type StatusPeriod = IPeriod & { getStatus(): Status };

// subjects belong to the period these props are added to: for intersection() and union() results, those of both periods
const statusMerger: PropsMerger = (_sourcePeriod, _otherPeriod, subjects) => {
  const status = (subjects as Status[]).reduce((worst, s) => (severity[s] > severity[worst] ? s : worst));
  return { getStatus: () => status };
};

const StatusPeriod = (start: number, end: number, status: Status) => Period(start, end, status, statusMerger);

// ===== BUILD THE BAR =====

// mix() splits overlapping periods into segments with the subjects of all periods that cover them
const day = StatusPeriod(0, 24, 'ok')
  .mix(StatusPeriod(6, 14, 'degraded'))
  .mix(StatusPeriod(9, 11, 'down'))
  .mix(StatusPeriod(18, 20, 'down'));

const segments = day.periods() as StatusPeriod[];

console.log('Segments:');
for (const segment of segments) {
  console.log(`  ${segment.toCompactString().padEnd(10)} ${segment.getStatus().padEnd(9)} ${segment.subjects.join(', ')}`);
}

// One block per hour, colored by the status of its segment
const draw = (bar: StatusPeriod[]) =>
  bar.map(s => color[s.getStatus()] + ' '.repeat(s.length()) + '\x1b[0m').join('');

console.log(`\n0h ${draw(segments)} 24h`);

// ===== QUERIES =====

const statusAt = (hour: number) => segments.find(s => s.existsAt(hour))?.getStatus();
console.log(`\nStatus at 10h: ${statusAt(10)}`); // down

// Results of other operations get a getStatus() too
const outage = StatusPeriod(0, 24, 'ok').union(StatusPeriod(18, 20, 'down')) as StatusPeriod;
console.log(`Worst status of the day: ${outage.getStatus()}`); // down

// A maintenance window cut out of the bar keeps the status of each remaining part
const afterMaintenance = day.subtract(Period(12, 16)).periods() as StatusPeriod[];
console.log(`\nWithout maintenance 12h-16h:`);
console.log(afterMaintenance.map(s => `${s.toCompactString()} ${s.getStatus()}`).join('\n'));
