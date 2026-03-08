import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  storeLocation: string;
  mode: 'day' | 'range';
}

export interface ShiftStatus {
  shiftType: '7-3' | '3-11' | '11-7';
  reportStatus: 'submitted' | 'draft' | 'not-started';
  incharge: string | null;
  reportId: number | null;
}

export interface RevenueData {
  totalSales: number;
  merchandiseSales: number;
  fuelSales: number;
  fuelVolume: number;
  safeDrops: number;
  lottoSales: number;
  payouts: number;
}

export interface ShiftBreakdownRow {
  shiftNumber: number;
  shiftDate: string;
  merchandise: number;
  fuel: number;
  safeDrops: number;
  lotto: number;
  payouts: number;
}

export interface CashAccountabilityRow {
  shiftType: string;
  totalCounted: number;
  saleDrops: number;
  remaining: number;
  expectedSafeDrops: number;
  variance: number;
}

export interface StockAlerts {
  lowInventory: { id: number; description: string; stock: number; warning: number }[];
  valueStockMismatches: { reportId: number; shiftType: string; label: string; expected: number; actual: number }[];
  drawerStockMismatches: { reportId: number; shiftType: string; contents: string; expected: number; actual: number }[];
}

export interface TaskProgress {
  totalTasks: number;
  completed: number;
  pendingVerification: number;
  approved: number;
  rejected: number;
}

export interface RecentReport {
  id: number;
  reportDate: string;
  shiftType: string;
  storeLocation: string;
  shiftIncharge: string;
  status: string;
  totalDSales: number | null;
  shiftSales: number | null;
  totalDrawerSold: number | null;
  createdAt: string;
}

export interface DashboardData {
  shifts: ShiftStatus[];
  revenue: RevenueData;
  shiftBreakdown: ShiftBreakdownRow[];
  cashAccountability: CashAccountabilityRow[];
  stockAlerts: StockAlerts;
  taskProgress: TaskProgress;
  recentReports: RecentReport[];
}

export function useDashboard(filters: DashboardFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['dashboard', filters.startDate, filters.endDate, filters.storeLocation],
    queryFn: async (): Promise<DashboardData> => {
      const { startDate, endDate, storeLocation } = filters;

      // Run all queries in parallel
      const [
        revenueResult,
        shiftBreakdownResult,
        safeDropTotalResult,
        shiftReportsResult,
        recentReportsResult,
        cashCountingResult,
        lowStockResult,
        taskTemplatesResult,
        taskCompletionsResult,
      ] = await Promise.all([
        // 1. Revenue aggregation via RPC
        supabase.rpc('get_dashboard_revenue', { start_date: startDate, end_date: endDate }),

        // 2. Shift breakdown via RPC
        supabase.rpc('get_dashboard_shift_breakdown', { start_date: startDate, end_date: endDate }),

        // 3. Safe drop total for cash accountability
        supabase
          .from('transactions')
          .select('safedrop')
          .eq('trn_type', 'safedrop')
          .gte('dateTime', startDate)
          .lte('dateTime', `${endDate}T23:59:59`),

        // 4. Shift reports for the date range (with child entries)
        (() => {
          let q = supabase
            .from('shift_reports')
            .select('id, report_date, shift_type, shift_incharge, store_location, status, total_d_sales, shift_sales, total_drawer_sold, created_at, value_stock_entries(amount_label, end_count, end_count_override, has_mismatch), drawer_stock_entries(contents, closing, closing_override, has_mismatch)')
            .gte('report_date', startDate)
            .lte('report_date', endDate)
            .order('report_date', { ascending: false });
          if (storeLocation) q = q.eq('store_location', storeLocation);
          return q;
        })(),

        // 3. Recent reports (last 10, no date filter)
        (() => {
          let q = supabase
            .from('shift_reports')
            .select('id, report_date, shift_type, shift_incharge, store_location, status, total_d_sales, shift_sales, total_drawer_sold, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
          if (storeLocation) q = q.eq('store_location', storeLocation);
          return q;
        })(),

        // 4. Cash counting entries for the date range
        (() => {
          let q = supabase
            .from('cash_counting_entries')
            .select('shift_type, total_amount, sale_drop, remaining, total_sale_drops')
            .gte('entry_date', startDate)
            .lte('entry_date', endDate);
          if (storeLocation) q = q.eq('store_location', storeLocation);
          return q;
        })(),

        // 5. Low inventory products
        supabase
          .from('products')
          .select('id, description, stock, low_stock_warning')
          .not('low_stock_warning', 'is', null)
          .gt('low_stock_warning', 0)
          .order('stock', { ascending: true })
          .limit(20),

        // 6. Task templates for today's day of week
        (() => {
          const dayOfWeek = dayjs(startDate).day();
          let q = supabase
            .from('task_templates')
            .select('id')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true);
          if (storeLocation) q = q.eq('store_location', storeLocation);
          return q;
        })(),

        // 7. Task completions for the date range
        (() => {
          let q = supabase
            .from('task_completions')
            .select('id, verification_status, template_id, task_completions_template_id_fkey:task_templates!inner(store_location)')
            .gte('task_date', startDate)
            .lte('task_date', endDate);
          if (storeLocation) {
            q = q.eq('task_completions_template_id_fkey.store_location', storeLocation);
          }
          return q;
        })(),
      ]);

      // Process revenue from RPC
      const revenueRaw = revenueResult.data || {};
      const revenue: RevenueData = {
        merchandiseSales: revenueRaw.merchandiseSales || 0,
        fuelSales: revenueRaw.fuelSales || 0,
        fuelVolume: revenueRaw.fuelVolume || 0,
        safeDrops: revenueRaw.safeDrops || 0,
        lottoSales: revenueRaw.lottoSales || 0,
        payouts: revenueRaw.payouts || 0,
        totalSales: (revenueRaw.merchandiseSales || 0) + (revenueRaw.fuelSales || 0),
      };

      // Shift breakdown from RPC
      const shiftBreakdown: ShiftBreakdownRow[] = (shiftBreakdownResult.data || []) as ShiftBreakdownRow[];

      // Process shift reports
      const shiftReports = shiftReportsResult.data || [];
      const shifts = buildShiftTimeline(shiftReports, startDate, endDate);
      const { valueStockMismatches, drawerStockMismatches } = buildStockMismatches(shiftReports);

      // Recent reports
      const recentReports: RecentReport[] = (recentReportsResult.data || []).map((r) => ({
        id: r.id,
        reportDate: r.report_date,
        shiftType: r.shift_type,
        storeLocation: r.store_location,
        shiftIncharge: r.shift_incharge,
        status: r.status,
        totalDSales: r.total_d_sales,
        shiftSales: r.shift_sales,
        totalDrawerSold: r.total_drawer_sold,
        createdAt: r.created_at,
      }));

      // Cash accountability
      const cashEntries = cashCountingResult.data || [];
      const totalSafeDrops = (safeDropTotalResult.data || []).reduce(
        (sum: number, t: Record<string, unknown>) => sum + ((t.safedrop as number) || 0), 0
      );
      const cashAccountability = buildCashAccountability(cashEntries, totalSafeDrops);

      // Low inventory
      const lowInventory = (lowStockResult.data || [])
        .filter((p) => (p.stock ?? 0) <= (p.low_stock_warning ?? 0))
        .map((p) => ({
          id: p.id,
          description: p.description || 'Unknown',
          stock: p.stock ?? 0,
          warning: p.low_stock_warning ?? 0,
        }));

      // Task progress
      const totalTasks = taskTemplatesResult.data?.length || 0;
      const completions = taskCompletionsResult.data || [];
      const taskProgress: TaskProgress = {
        totalTasks,
        completed: completions.length,
        pendingVerification: completions.filter((c) => c.verification_status === 'pending').length,
        approved: completions.filter((c) => c.verification_status === 'approved').length,
        rejected: completions.filter((c) => c.verification_status === 'rejected').length,
      };

      return {
        shifts,
        revenue,
        shiftBreakdown,
        cashAccountability,
        stockAlerts: { lowInventory, valueStockMismatches, drawerStockMismatches },
        taskProgress,
        recentReports,
      };
    },
  });
}

// --- Helper functions ---

function buildShiftTimeline(
  reports: Record<string, unknown>[],
  startDate: string,
  endDate: string,
): ShiftStatus[] {
  const isSingleDay = startDate === endDate;
  const shiftTypes: ('7-3' | '3-11' | '11-7')[] = ['7-3', '3-11', '11-7'];

  if (!isSingleDay) {
    return [];
  }

  return shiftTypes.map((st) => {
    const report = reports.find((r) => r.shift_type === st && r.report_date === startDate);
    if (report) {
      return {
        shiftType: st,
        reportStatus: (report.status as string) === 'submitted' ? 'submitted' : 'draft',
        incharge: (report.shift_incharge as string) || null,
        reportId: report.id as number,
      };
    }
    return { shiftType: st, reportStatus: 'not-started' as const, incharge: null, reportId: null };
  });
}

function buildStockMismatches(reports: Record<string, unknown>[]) {
  const valueStockMismatches: StockAlerts['valueStockMismatches'] = [];
  const drawerStockMismatches: StockAlerts['drawerStockMismatches'] = [];

  for (const report of reports) {
    const reportId = report.id as number;
    const shiftType = report.shift_type as string;

    const valueEntries = (report.value_stock_entries as Record<string, unknown>[]) || [];
    for (const entry of valueEntries) {
      if (entry.has_mismatch) {
        valueStockMismatches.push({
          reportId,
          shiftType,
          label: entry.amount_label as string,
          expected: entry.end_count as number,
          actual: (entry.end_count_override as number) ?? (entry.end_count as number),
        });
      }
    }

    const drawerEntries = (report.drawer_stock_entries as Record<string, unknown>[]) || [];
    for (const entry of drawerEntries) {
      if (entry.has_mismatch) {
        drawerStockMismatches.push({
          reportId,
          shiftType,
          contents: entry.contents as string,
          expected: entry.closing as number,
          actual: (entry.closing_override as number) ?? (entry.closing as number),
        });
      }
    }
  }

  return { valueStockMismatches, drawerStockMismatches };
}

function buildCashAccountability(
  cashEntries: Record<string, unknown>[],
  totalSafeDrops: number,
): CashAccountabilityRow[] {
  if (cashEntries.length === 0) return [];

  // Group cash entries by shift type
  const byShift: Record<string, { totalCounted: number; saleDrops: number; remaining: number }> = {};
  for (const entry of cashEntries) {
    const st = entry.shift_type as string;
    if (!byShift[st]) {
      byShift[st] = { totalCounted: 0, saleDrops: 0, remaining: 0 };
    }
    byShift[st].totalCounted += (entry.total_amount as number) || 0;
    byShift[st].saleDrops += (entry.total_sale_drops as number) || 0;
    byShift[st].remaining += (entry.remaining as number) || 0;
  }

  const shiftTypes = Object.keys(byShift);
  const expectedPerShift = shiftTypes.length > 0 ? totalSafeDrops / shiftTypes.length : 0;

  return shiftTypes.map((st) => {
    const data = byShift[st];
    return {
      shiftType: st,
      totalCounted: data.totalCounted,
      saleDrops: data.saleDrops,
      remaining: data.remaining,
      expectedSafeDrops: expectedPerShift,
      variance: data.saleDrops - expectedPerShift,
    };
  });
}
