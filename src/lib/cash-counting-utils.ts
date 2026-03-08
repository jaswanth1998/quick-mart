import { CASH_DENOMINATIONS } from './cash-counting-constants';

export interface CashCountingEntry {
  id: number;
  entry_date: string;
  shift_type: string;
  shift_incharge: string;
  store_location: string;
  bills_100: number;
  bills_50: number;
  bills_20: number;
  bills_10: number;
  bills_5: number;
  bills_2: number;
  bills_1: number;
  coins_25: number;
  coins_10: number;
  coins_5: number;
  total_amount: number;
  sale_drop: number;
  remaining: number;
  total_sale_drops: number;
  status: 'draft' | 'submitted';
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type EntryStatus = 'Balanced' | 'Needs Review' | 'High Remaining' | 'Low Drop' | 'Mismatch';

export interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
  entry?: CashCountingEntry;
}

/**
 * Calculate total amount from denomination counts
 */
export function calculateTotalAmount(entry: Partial<CashCountingEntry>): number {
  let total = 0;

  for (const denom of CASH_DENOMINATIONS) {
    const count = entry[denom.key] || 0;
    total += count * denom.faceValue;
  }

  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate remaining cash (Total Amount - Sale Drop)
 */
export function calculateRemaining(totalAmount: number, saleDrop: number): number {
  return Math.round((totalAmount - saleDrop) * 100) / 100;
}

/**
 * Get entry status based on statistical analysis
 */
export function getEntryStatus(
  entry: CashCountingEntry,
  mean: number,
  stdDev: number
): EntryStatus {
  const { remaining, sale_drop, total_amount } = entry;

  // Check for negative values
  if (remaining < 0 || sale_drop < 0 || total_amount < 0) {
    return 'Mismatch';
  }

  // Check if sale drop is suspiciously low
  if (sale_drop < 50) {
    return 'Low Drop';
  }

  // Check if remaining is more than 2 standard deviations above mean
  if (remaining > mean + 2 * stdDev) {
    return 'High Remaining';
  }

  // Check if remaining is between 1 and 2 standard deviations
  if (remaining > mean + stdDev) {
    return 'Needs Review';
  }

  return 'Balanced';
}

/**
 * Calculate statistics for a set of entries
 */
export function calculateStats(entries: CashCountingEntry[]) {
  if (entries.length === 0) {
    return {
      totalCashCounted: 0,
      totalSaleDrops: 0,
      totalRemaining: 0,
      shiftsLogged: 0,
      highestCashShift: null as CashCountingEntry | null,
      varianceAlerts: 0,
      meanRemaining: 0,
      stdDevRemaining: 0,
    };
  }

  const totalCashCounted = entries.reduce((sum, e) => sum + e.total_amount, 0);
  const totalSaleDrops = entries.reduce((sum, e) => sum + e.sale_drop, 0);
  const totalRemaining = entries.reduce((sum, e) => sum + e.remaining, 0);
  const shiftsLogged = entries.length;

  const highestCashShift = entries.reduce((max, e) =>
    (e.total_amount > (max?.total_amount || 0) ? e : max), entries[0]);

  // Calculate mean and standard deviation for remaining amounts
  const meanRemaining = totalRemaining / shiftsLogged;
  const variance = entries.reduce((sum, e) =>
    sum + Math.pow(e.remaining - meanRemaining, 2), 0) / shiftsLogged;
  const stdDevRemaining = Math.sqrt(variance);

  const varianceAlerts = entries.filter(e =>
    getEntryStatus(e, meanRemaining, stdDevRemaining) !== 'Balanced'
  ).length;

  return {
    totalCashCounted: Math.round(totalCashCounted * 100) / 100,
    totalSaleDrops: Math.round(totalSaleDrops * 100) / 100,
    totalRemaining: Math.round(totalRemaining * 100) / 100,
    shiftsLogged,
    highestCashShift,
    varianceAlerts,
    meanRemaining: Math.round(meanRemaining * 100) / 100,
    stdDevRemaining: Math.round(stdDevRemaining * 100) / 100,
  };
}

/**
 * Calculate denomination breakdown percentages
 */
export function calculateDenominationBreakdown(entries: CashCountingEntry[]) {
  const breakdown = CASH_DENOMINATIONS.map(denom => {
    const totalCount = entries.reduce((sum, e) => sum + (e[denom.key] || 0), 0);
    const totalValue = totalCount * denom.faceValue;

    return {
      ...denom,
      totalCount,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  });

  const grandTotal = breakdown.reduce((sum, d) => sum + d.totalValue, 0);

  return breakdown.map(d => ({
    ...d,
    percentage: grandTotal > 0 ? Math.round((d.totalValue / grandTotal) * 100 * 100) / 100 : 0,
  }));
}

/**
 * Generate business insights from entries
 */
export function generateInsights(entries: CashCountingEntry[]): string[] {
  if (entries.length === 0) {
    return ['No data available for analysis'];
  }

  const insights: string[] = [];
  const stats = calculateStats(entries);
  const breakdown = calculateDenominationBreakdown(entries);

  // Insight 1: Overall performance
  const avgRemaining = stats.meanRemaining;
  insights.push(
    `Average remaining cash per shift is $${avgRemaining.toFixed(2)}, ` +
    `indicating ${avgRemaining > 100 ? 'higher than normal' : 'normal'} cash retention.`
  );

  // Insight 2: Top denomination
  const topDenom = breakdown.reduce((max, d) =>
    d.totalValue > max.totalValue ? d : max, breakdown[0]);
  insights.push(
    `${topDenom.label} bills make up ${topDenom.percentage}% of total cash, ` +
    `with ${topDenom.totalCount} units counted.`
  );

  // Insight 3: Shift analysis
  const shiftBreakdown = entries.reduce((acc, e) => {
    acc[e.shift_type] = (acc[e.shift_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveShift = Object.entries(shiftBreakdown).reduce((max, [shift, count]) =>
    count > max.count ? { shift, count } : max, { shift: '', count: 0 });

  insights.push(
    `Shift ${mostActiveShift.shift} has the most entries (${mostActiveShift.count}), ` +
    `accounting for ${Math.round(mostActiveShift.count / entries.length * 100)}% of all shifts.`
  );

  // Insight 4: Alert rate
  const alertRate = Math.round((stats.varianceAlerts / stats.shiftsLogged) * 100);
  insights.push(
    `${alertRate}% of shifts require attention due to variances or anomalies.`
  );

  // Insight 5: Sale drop trends
  const avgSaleDrop = stats.totalSaleDrops / stats.shiftsLogged;
  insights.push(
    `Average sale drop per shift is $${avgSaleDrop.toFixed(2)}, ` +
    `suggesting ${avgSaleDrop > 500 ? 'strong' : avgSaleDrop > 200 ? 'moderate' : 'low'} sales activity.`
  );

  return insights;
}

/**
 * Generate alerts for exceptions
 */
export function generateAlerts(entries: CashCountingEntry[]): Alert[] {
  const alerts: Alert[] = [];
  const stats = calculateStats(entries);

  for (const entry of entries) {
    // Alert for negative values
    if (entry.remaining < 0) {
      alerts.push({
        type: 'error',
        message: `Negative remaining cash on ${entry.entry_date} (${entry.shift_type})`,
        entry,
      });
    }

    // Alert for very high remaining
    if (entry.remaining > stats.meanRemaining + 2 * stats.stdDevRemaining) {
      alerts.push({
        type: 'warning',
        message: `Unusually high remaining cash on ${entry.entry_date} (${entry.shift_type}): $${entry.remaining.toFixed(2)}`,
        entry,
      });
    }

    // Alert for low sale drop
    if (entry.sale_drop < 50 && entry.status === 'submitted') {
      alerts.push({
        type: 'warning',
        message: `Low sale drop on ${entry.entry_date} (${entry.shift_type}): $${entry.sale_drop.toFixed(2)}`,
        entry,
      });
    }

    // Alert for missing store location
    if (!entry.store_location) {
      alerts.push({
        type: 'info',
        message: `Missing store location on ${entry.entry_date} (${entry.shift_type})`,
        entry,
      });
    }

    // Alert for draft status
    if (entry.status === 'draft') {
      alerts.push({
        type: 'info',
        message: `Draft entry not yet submitted: ${entry.entry_date} (${entry.shift_type})`,
        entry,
      });
    }
  }

  return alerts;
}
