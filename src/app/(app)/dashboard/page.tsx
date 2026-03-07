'use client';

import { useState } from 'react';
import { ShoppingCart, Car, DollarSign, Trophy, Wallet, Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange } from '@/lib/utils';

interface AnalyticsData {
  merchandise: {
    totalAmount: number;
    uniqueShifts: number;
  };
  fuel: {
    totalByType: { type: string; total: number; volume: number }[];
  };
  safedrop: {
    totalByShift: { shiftNumber: number; total: number }[];
  };
  lotto: {
    totalByShift: { shiftNumber: number; total: number }[];
  };
  payout: {
    totalByType: { type: string; total: number }[];
  };
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard-analytics', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: async (): Promise<AnalyticsData> => {
      const supabase = createClient();
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('dateTime', startDate)
        .lte('dateTime', `${endDate}T23:59:59`);

      if (error) throw new Error(error.message);

      const data = transactions || [];

      const merchandiseTransactions = data;
      const merchandiseTotalAmount = merchandiseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const merchandiseUniqueShifts = new Set(merchandiseTransactions.map(t => t.shiftNumber)).size;

      const fuelTransactions = data.filter(t => t.trn_type === 'fuel');
      const fuelByType = fuelTransactions.reduce((acc, t) => {
        const type = t.productDescription || 'Unknown';
        if (!acc[type]) acc[type] = { total: 0, volume: 0 };
        acc[type].total += t.amount || 0;
        acc[type].volume += t.volume || 0;
        return acc;
      }, {} as Record<string, { total: number; volume: number }>);
      const fuelTotalByType = Object.entries(fuelByType).map(([type, fuelData]) => ({
        type,
        total: (fuelData as { total: number; volume: number }).total,
        volume: (fuelData as { total: number; volume: number }).volume,
      }));

      const safedropTransactions = data.filter(t => t.trn_type === 'safedrop');
      const safedropByShift = safedropTransactions.reduce((acc, t) => {
        if (!acc[t.shiftNumber]) acc[t.shiftNumber] = 0;
        acc[t.shiftNumber] += t.safedrop || 0;
        return acc;
      }, {} as Record<number, number>);
      const safedropTotalByShift = Object.entries(safedropByShift).map(([shift, total]) => ({
        shiftNumber: Number(shift),
        total: total as number,
      }));

      const lottoTransactions = data.filter(t => t.trn_type === 'lotto');
      const lottoByShift = lottoTransactions.reduce((acc, t) => {
        if (!acc[t.shiftNumber]) acc[t.shiftNumber] = 0;
        acc[t.shiftNumber] += t.lotto || 0;
        return acc;
      }, {} as Record<number, number>);
      const lottoTotalByShift = Object.entries(lottoByShift).map(([shift, total]) => ({
        shiftNumber: Number(shift),
        total: total as number,
      }));

      const payoutTransactions = data.filter(t => t.trn_type === 'payout');
      const payoutByType = payoutTransactions.reduce((acc, t) => {
        const type = t.payout_type || 'Unknown';
        if (!acc[type]) acc[type] = 0;
        acc[type] += t.payout || 0;
        return acc;
      }, {} as Record<string, number>);
      const payoutTotalByType = Object.entries(payoutByType).map(([type, total]) => ({
        type,
        total: total as number,
      }));

      return {
        merchandise: { totalAmount: merchandiseTotalAmount, uniqueShifts: merchandiseUniqueShifts },
        fuel: { totalByType: fuelTotalByType },
        safedrop: { totalByShift: safedropTotalByShift },
        lotto: { totalByShift: lottoTotalByShift },
        payout: { totalByType: payoutTotalByType },
      };
    },
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string; value: string; icon: typeof TrendingUp; color: string; subtitle?: string;
  }) => (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );

  const SummaryTable = ({ title, icon: Icon, columns, data: tableData, totalRow }: {
    title: string;
    icon: typeof ShoppingCart;
    columns: { key: string; label: string; render?: (val: number) => string }[];
    data: Record<string, unknown>[];
    totalRow?: Record<string, string>;
  }) => (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No data for selected period
                </td>
              </tr>
            ) : (
              tableData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-3 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key] as number) : String(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
            {totalRow && tableData.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-3 text-sm text-gray-900">
                    {totalRow[col.key] || ''}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const fuelTotal = analytics?.fuel.totalByType.reduce((s, i) => s + i.total, 0) || 0;
  const fuelVolume = analytics?.fuel.totalByType.reduce((s, i) => s + i.volume, 0) || 0;
  const safedropTotal = analytics?.safedrop.totalByShift.reduce((s, i) => s + i.total, 0) || 0;
  const lottoTotal = analytics?.lotto.totalByShift.reduce((s, i) => s + i.total, 0) || 0;
  const payoutTotal = analytics?.payout.totalByType.reduce((s, i) => s + i.total, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange[0].format('YYYY-MM-DD')}
            onChange={(e) => e.target.value && setDateRange([dayjs(e.target.value), dateRange[1]])}
            className="input w-40 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange[1].format('YYYY-MM-DD')}
            onChange={(e) => e.target.value && setDateRange([dateRange[0], dayjs(e.target.value)])}
            className="input w-40 text-sm"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Merchandise Sales"
              value={`$${(analytics?.merchandise.totalAmount || 0).toFixed(2)}`}
              icon={ShoppingCart}
              color="text-green-600"
              subtitle={`${analytics?.merchandise.uniqueShifts || 0} shifts`}
            />
            <StatCard
              title="Fuel Sales"
              value={`$${fuelTotal.toFixed(2)}`}
              icon={Car}
              color="text-blue-600"
              subtitle={`${fuelVolume.toFixed(0)} gallons`}
            />
            <StatCard
              title="Safe Drops"
              value={`$${safedropTotal.toFixed(2)}`}
              icon={DollarSign}
              color="text-purple-600"
            />
            <StatCard
              title="Lotto Sales"
              value={`$${lottoTotal.toFixed(2)}`}
              icon={Trophy}
              color="text-orange-600"
            />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryTable
              title="Fuel Sales"
              icon={Car}
              columns={[
                { key: 'type', label: 'Fuel Type' },
                { key: 'volume', label: 'Volume (Gal)', render: (v) => v.toFixed(2) },
                { key: 'total', label: 'Total Amount', render: (v) => `$${v.toFixed(2)}` },
              ]}
              data={analytics?.fuel.totalByType || []}
              totalRow={{ type: 'Total', volume: fuelVolume.toFixed(2), total: `$${fuelTotal.toFixed(2)}` }}
            />

            <SummaryTable
              title="Safe Drops"
              icon={DollarSign}
              columns={[
                { key: 'shiftNumber', label: 'Shift Number' },
                { key: 'total', label: 'Total Amount', render: (v) => `$${v.toFixed(2)}` },
              ]}
              data={analytics?.safedrop.totalByShift || []}
              totalRow={{ shiftNumber: 'Total', total: `$${safedropTotal.toFixed(2)}` }}
            />

            <SummaryTable
              title="Lotto Sales"
              icon={Trophy}
              columns={[
                { key: 'shiftNumber', label: 'Shift Number' },
                { key: 'total', label: 'Total Amount', render: (v) => `$${v.toFixed(2)}` },
              ]}
              data={analytics?.lotto.totalByShift || []}
              totalRow={{ shiftNumber: 'Total', total: `$${lottoTotal.toFixed(2)}` }}
            />

            <SummaryTable
              title="Payouts"
              icon={Wallet}
              columns={[
                { key: 'type', label: 'Payout Type' },
                { key: 'total', label: 'Total Amount', render: (v) => `$${v.toFixed(2)}` },
              ]}
              data={analytics?.payout.totalByType || []}
              totalRow={{ type: 'Total', total: `$${payoutTotal.toFixed(2)}` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
