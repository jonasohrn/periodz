/* eslint-disable no-console */
// Periodz with Temporal, Luxon, Chronera and date-fns values, and Moment in comments. See docs/date-like-adapters.md.

import { Temporal } from '@js-temporal/polyfill';
import { DateTime } from 'luxon';
import { chronera } from '@intech-software/chronera';
import { addDays, eachDayOfInterval, format, millisecondsToHours, setHours } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { Period, PeriodSeq, type IPeriod } from '../../../src/index.ts';
import { ChroneraPoint, DayPoint, LuxonPoint, TemporalPoint, type MsPoint } from './points.ts';

const zone = 'Europe/Stockholm';

// ===== TEMPORAL =====

const day = (iso: string) => DayPoint(Temporal.PlainDate.from(iso));
const vacation = Period(day('2026-06-22'), day('2026-07-13'));
const julyVacation = vacation.intersection(Period(day('2026-07-01'), day('2026-08-01')));
console.log('July vacation:', julyVacation.toCompactString(), julyVacation.length(), 'days'); // (2026-07-01, 2026-07-13) 12 days

// A booking from another system, 15:00–16:00 in Stockholm
const instant = (iso: string) => TemporalPoint(Temporal.Instant.from(iso));
const booking = Period(instant('2026-03-02T14:00:00Z'), instant('2026-03-02T15:00:00Z'));

// ===== LUXON: FREE TIME IN A MEETING ROOM =====

const at = (time: string) => LuxonPoint(DateTime.fromISO(`2026-03-02T${time}`, { zone }));

const workday = Period(at('08:00'), at('17:00'));
const meetings = PeriodSeq([Period(at('09:00'), at('10:00')), Period(at('13:00'), at('14:30'))]);

// All MsPoints combine, whichever library they wrap
const free = workday.subtract(meetings).subtract(booking);

// The endpoints are the original Luxon, Temporal or Chronera values in .value, and every MsPoint has .ms
const hhmm = (p: IPeriod) => [p.start, p.end]
  .map((point) => DateTime.fromMillis((point as MsPoint<unknown>).ms, { zone }).toFormat('HH:mm'))
  .join('–');
console.log('Free:', free.periods().map(hhmm).join(', ')); // 08:00–09:00, 10:00–13:00, 14:30–15:00, 16:00–17:00
console.log('Free hours:', free.length() / 3_600_000); // 5.5
console.log('Free at 11:00:', free.existsAt(at('11:00'))); // true

// ===== CHRONERA: A CALL FROM BANGKOK =====

const bangkok = (time: string) => ChroneraPoint(chronera(`2026-03-02T${time}[Asia/Bangkok]`));
const call = Period(bangkok('22:00'), bangkok('22:30')); // 16:00–16:30 in Stockholm
console.log('Free after the call:', free.subtract(call).periods().map(hhmm).join(', ')); // 08:00–09:00, 10:00–13:00, 14:30–15:00, 16:30–17:00

// ===== DATE-FNS: OPENING HOURS IN A WEEK =====

// date-fns works on Date, which Periodz supports without a wrapper. TZDate from @date-fns/tz is a Date in a time zone.
const monday = new TZDate(2026, 2, 2, zone);
const weekdays = eachDayOfInterval({ start: monday, end: addDays(monday, 4) });
const openingHours = PeriodSeq(weekdays.map((day) => Period(setHours(day, 9), setHours(day, 17))));
const closed = Period(new TZDate(2026, 2, 4, 12, zone), new TZDate(2026, 2, 5, 12, zone)); // Wednesday 12:00 to Thursday 12:00
const open = openingHours.subtract(closed);

const dayHours = (p: IPeriod) => `${format(p.start as Date, 'EEE HH')}–${format(p.end as Date, 'HH')}`;
console.log('Open:', open.periods().map(dayHours).join(', ')); // Mon 09–17, Tue 09–17, Wed 09–12, Thu 12–17, Fri 09–17
console.log('Open hours:', millisecondsToHours(open.length())); // 32

// ===== MOMENT =====
// ATTENTION: Switch to Day.js asap - it has a Moment.js-compatible API. Moment is not maintained anymore.
// import moment, { type Moment } from 'moment';
// import { MsPoint } from './points.ts';
//
// const MomentPoint = (m: Moment) => MsPoint(m.clone(), m.valueOf()); // Moments are mutable
// const legacy = Period(MomentPoint(moment.utc('2026-03-02T11:00:00Z')), MomentPoint(moment.utc('2026-03-02T12:00:00Z')));
// console.log('Free:', free.subtract(legacy).periods().map(hhmm).join(', ')); // 08:00–09:00, 10:00–12:00, 14:30–15:00, 16:00–17:00

// ===== NO MIXING WITH BUILT-IN TYPES =====

// Dates, also from date-fns, don't combine with MsPoints. Wrap them with MsPoint(date, date.getTime()) to do that.
try {
  workday.union(openingHours);
} catch (error) {
  console.log((error as Error).message); // Cannot handle mixed types; Date and non-Date objects
}
