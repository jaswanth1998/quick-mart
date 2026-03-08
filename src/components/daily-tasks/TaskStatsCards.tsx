'use client';

import { ClipboardCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TaskStatsCardsProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  isLoading?: boolean;
}

export function TaskStatsCards({ total, pending, approved, rejected, isLoading }: TaskStatsCardsProps) {
  const stats = [
    { label: 'Total Submitted', value: total, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Review', value: pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Approved', value: approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
