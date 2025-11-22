import dayjs from 'dayjs';

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

/**
 * Format a date to a readable date-time string
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Get date range for filters (default last month)
 */
export function getDefaultDateRange(): [string, string] {
  const end = dayjs();
  const start = dayjs().subtract(1, 'month');
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Parse date from format YYYYMMDD
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr || dateStr.length !== 8) {
    throw new Error('Invalid date format. Expected YYYYMMDD');
  }
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

/**
 * Parse time from format HHMMSS
 */
export function parseTime(timeStr: string): string {
  if (!timeStr || timeStr.length !== 6) {
    throw new Error('Invalid time format. Expected HHMMSS');
  }
  const hours = timeStr.substring(0, 2);
  const minutes = timeStr.substring(2, 4);
  const seconds = timeStr.substring(4, 6);
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Parse date and time to ISO format
 */
export function parseDateTime(dateStr: string, timeStr: string): string {
  const date = parseDate(dateStr);
  const time = parseTime(timeStr);
  return dayjs(`${date.toISOString().split('T')[0]} ${time}`).toISOString();
}

/**
 * Trim all string fields in an object
 */
export function trimObjectStrings<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as any;
  Object.keys(result).forEach((key) => {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim();
    }
  });
  return result as T;
}
