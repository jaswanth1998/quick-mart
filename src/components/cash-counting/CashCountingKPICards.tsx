'use client';

import { DollarSign, TrendingUp, AlertTriangle, FileText, ArrowUp, Coins } from 'lucide-react';
import { calculateStats } from '@/lib/cash-counting-utils';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';

interface CashCountingKPICardsProps {
  entries: CashCountingEntry[];
}

export default function CashCountingKPICards({ entries }: CashCountingKPICardsProps) {
  const stats = calculateStats(entries);

  const kpis = [
    {
      label: 'Total Cash Counted',
      value: `$${stats.totalCashCounted.toFixed(2)}`,
      icon: DollarSign,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Sale Drops',
      value: `$${stats.totalSaleDrops.toFixed(2)}`,
      icon: TrendingUp,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Remaining',
      value: `$${stats.totalRemaining.toFixed(2)}`,
      icon: Coins,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Shifts Logged',
      value: stats.shiftsLogged.toString(),
      icon: FileText,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Highest Cash Shift',
      value: stats.highestCashShift
        ? `$${stats.highestCashShift.total_amount.toFixed(2)}`
        : 'N/A',
      icon: ArrowUp,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: stats.highestCashShift
        ? `${stats.highestCashShift.entry_date} (${stats.highestCashShift.shift_type})`
        : undefined,
    },
    {
      label: 'Variance Alerts',
      value: stats.varianceAlerts.toString(),
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: `${Math.round((stats.varianceAlerts / (stats.shiftsLogged || 1)) * 100)}% of shifts`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>
                )}
              </div>
              <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
