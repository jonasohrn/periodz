import { Temporal } from '@js-temporal/polyfill';
import type { DateTime } from 'luxon';
import type { Chronera } from '@intech-software/chronera';

// Wrappers that give Temporal, Luxon and Chronera values the compareTo() and diff() that Periodz needs.
// diff() is the distance used by length().

// A point in time as epoch milliseconds. Points of all libraries combine with each other.
export const MsPoint = <T>(value: T, ms: number) => {
  const diff = (other: { ms: number }) => ms - other.ms;
  return { value, ms, compareTo: diff, diff, toString: () => String(value) };
};
export type MsPoint<T> = ReturnType<typeof MsPoint<T>>;

export const TemporalPoint = (t: Temporal.Instant | Temporal.ZonedDateTime) => MsPoint(t, t.epochMilliseconds);
export const LuxonPoint = (dt: DateTime) => MsPoint(dt, dt.toMillis());
export const ChroneraPoint = (c: Chronera) => MsPoint(c, c.toInstant().epochMilliseconds); // A plain date becomes midnight UTC

// A calendar date without a time zone. length() is in days. Don't combine with MsPoints.
export const DayPoint = (value: Temporal.PlainDate) => {
  const diff = (other: { value: Temporal.PlainDate }) => other.value.until(value).days;
  return { value, compareTo: diff, diff, toString: () => value.toString() };
};
