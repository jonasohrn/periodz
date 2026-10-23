import type {
  ComparableValue,
  CompareFn,
  ComparisonResult,
  CustomComparable,
  DayjsLike as Dayjs,
  DifferenceFn,
  IComparable,
  IComp,
} from './types';

import { assert, PeriodzError } from './guards';

// Internal type identification
export enum InternalType {
  Number = 'TYPE_Number',
  Date = 'TYPE_Date',
  Dayjs = 'TYPE_Dayjs',
  Custom = 'TYPE_Custom',
}

// Utility function to get a comparison result
const compareToValue = (value: number): ComparisonResult => {
  return Math.sign(value) as ComparisonResult;
};

// Difference functions for each type
const numberDiff = (source: number, other: IComparable<number>): number => {
  assert(internalTypeFromSource(other.source) === InternalType.Number, () => 'Cannot handle mixed types; Number and non-Number objects');
  return source - other.source;
};

const dayjsDiff = (source: Dayjs, other: IComparable<Dayjs>): number => {
  assert(internalTypeFromSource(other.source) === InternalType.Dayjs, () => 'Cannot handle mixed types; Dayjs and non-Dayjs objects');
  return source.diff(other.source);
};

const dateDiff = (source: Date, other: IComparable<Date>): number => {
  assert(internalTypeFromSource(other.source) === InternalType.Date, () => 'Cannot handle mixed types; Date and non-Date objects');
  return source.getTime() - other.source.getTime();
};

// Custom objects can be compared with any other custom object, and their compareTo() and diff() decide what they accept
const customDiff = (source: CustomComparable, other: IComparable<CustomComparable>): number => {
  assert(internalTypeFromSource(other.source) === InternalType.Custom, () => 'Cannot handle mixed types; custom and non-custom objects');
  return source.diff(other.source as never);
};

// Comparison functions for each type
const numberCompare = (source: number, other: IComparable<number>): ComparisonResult => {
  return compareToValue(numberDiff(source, other));
};

const dayjsCompare = (source: Dayjs, other: IComparable<Dayjs>): ComparisonResult => {
  return compareToValue(dayjsDiff(source, other));
};

const dateCompare = (source: Date, other: IComparable<Date>): ComparisonResult => {
  return compareToValue(dateDiff(source, other));
};

const customCompare = (source: CustomComparable, other: IComparable<CustomComparable>): ComparisonResult => {
  assert(internalTypeFromSource(other.source) === InternalType.Custom, () => 'Cannot handle mixed types; custom and non-custom objects');
  return compareToValue(source.compareTo(other.source as never));
};

// Type detection function
const internalTypeFromSource = (src: ComparableValue): InternalType => {
  if (typeof src === 'number') {
    return InternalType.Number;
  } else if (src instanceof Date) {
    return InternalType.Date;
  } else if (typeof src === 'object' && '$isDayjsObject' in src) {
    return InternalType.Dayjs;
  } else if (typeof (src as Partial<CustomComparable>).compareTo === 'function' &&
             typeof (src as Partial<CustomComparable>).diff === 'function') {
    return InternalType.Custom;
  } else {
    throw new PeriodzError(`Comparable: Unsupported source of type: ${typeof src}`);
  }
};

export const isComparable: (value: IComp) => value is IComp = (value: IComp): value is IComp => {
  return value.kind === 'Comparable';
};

// Lookup tables for functions
const differenceFnLUT: Record<InternalType, DifferenceFn> = {
  [InternalType.Number]: numberDiff as DifferenceFn,
  [InternalType.Dayjs]: dayjsDiff as DifferenceFn,
  [InternalType.Date]: dateDiff as DifferenceFn,
  [InternalType.Custom]: customDiff as DifferenceFn,
};

const compareFnLUT: Record<InternalType, CompareFn> = {
  [InternalType.Number]: numberCompare as CompareFn,
  [InternalType.Dayjs]: dayjsCompare as CompareFn,
  [InternalType.Date]: dateCompare as CompareFn,
  [InternalType.Custom]: customCompare as CompareFn,
};

/**
 * Wraps a start or end value so that it can be compared with other values of the same type, as Period does.
 * Returns the value as is when it is already wrapped.
 * @throws PeriodzError if the value is missing or of an unsupported type.
 */
export const Comparable = (sourceArg: unknown): IComp => {
  if (sourceArg === undefined || sourceArg === null) {
    throw new PeriodzError('Comparable: no source argument');
  }

  // If already a IComparable, return as is (with proper typing)
  if (isComparable(sourceArg as unknown as IComp)) {
    return sourceArg as unknown as IComp;
  }

  const source = sourceArg as ComparableValue;
  const internalType = internalTypeFromSource(source);

  const compareFn = compareFnLUT[internalType];
  const differenceFn = differenceFnLUT[internalType];

  const comparable: IComp = {
    kind: 'Comparable' as const,

    // Custom objects are not frozen, since they belong to the caller and may cache values in themselves
    source: internalType === InternalType.Custom ? source : Object.freeze(source),
    
    compareTo(other: IComp): ComparisonResult {
      return compareFn(source, other);
    },

    eq(other: IComp): boolean {
      return compareFn(source, other) === 0;
    },

    lt(other: IComp): boolean {
      return compareFn(source, other) < 0;
    },

    lte(other: IComp): boolean {
      return compareFn(source, other) <= 0;
    },

    gt(other: IComp): boolean {
      return compareFn(source, other) > 0;
    },

    gte(other: IComp): boolean {
      return compareFn(source, other) >= 0;
    },

    min(other: IComp): IComp {
      return comparable.lt(other) ? comparable : other;
    },

    max(other: IComp): IComp {
      return comparable.gt(other) ? comparable : other;
    },

    diff(other: IComp): number {
      return differenceFn(source, other);
    },

    toString(): string {
      if (internalType === InternalType.Dayjs) {
        const dayjsSource = source as unknown as Dayjs;
        const HHmmss = dayjsSource.format('HH:mm:ss');
        const dateString = dayjsSource.format('YYYY-MM-DD');
        return HHmmss === '00:00:00' ? dateString : `${dateString} ${HHmmss}`;
      }
      
      if (internalType === InternalType.Date) {
        return (source as Date).toISOString();
      }
      
      return String(source);
    }
  };

  return comparable;
};

