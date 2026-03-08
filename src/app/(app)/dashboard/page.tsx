'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { useDashboard } from '@/hooks/useDashboard';
import type { DashboardFilters as Filters } from '@/hooks/useDashboard';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import ShiftTimeline from '@/components/dashboard/ShiftTimeline';
import RevenueKPICards from '@/components/dashboard/RevenueKPICards';
import ShiftBreakdownTable from '@/components/dashboard/ShiftBreakdownTable';
import CashAccountabilityCard from '@/components/dashboard/CashAccountabilityCard';
import StockAlertsCard from '@/components/dashboard/StockAlertsCard';
import TaskProgressCard from '@/components/dashboard/TaskProgressCard';
import RecentReportsTable from '@/components/dashboard/RecentReportsTable';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

export default function DashboardPage() {
  const { isLoading: adminLoading } = useRequireAdmin();

  const today = dayjs().format('YYYY-MM-DD');
  const [filters, setFilters] = useState<Filters>({
    startDate: today,
    endDate: today,
    storeLocation: '',
    mode: 'day',
  });

  const { data, isLoading, isError, refetch } = useDashboard(filters);

  if (adminLoading) return null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DashboardFilters filters={filters} onChange={setFilters} />

      {/* Loading */}
      {isLoading && <DashboardSkeleton />}

      {/* Error */}
      {isError && (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-600 mb-3">Failed to load dashboard data</p>
          <button onClick={() => refetch()} className="btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {data && !isLoading && (
        <>
          {/* Shift Timeline (single day only) */}
          {filters.mode === 'day' && data.shifts.length > 0 && (
            <ShiftTimeline shifts={data.shifts} />
          )}

          {/* Revenue KPI Cards */}
          <RevenueKPICards revenue={data.revenue} />

          {/* Shift Breakdown + Cash Accountability */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ShiftBreakdownTable data={data.shiftBreakdown} />
            </div>
            <div>
              <CashAccountabilityCard data={data.cashAccountability} />
            </div>
          </div>

          {/* Stock Alerts + Task Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StockAlertsCard alerts={data.stockAlerts} />
            <TaskProgressCard progress={data.taskProgress} />
          </div>

          {/* Recent Shift Reports */}
          <RecentReportsTable reports={data.recentReports} />
        </>
      )}
    </div>
  );
}
