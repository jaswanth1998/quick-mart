'use client';

import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { STORE_LOCATIONS } from '@/lib/shift-report-constants';
import type { DashboardFilters as Filters } from '@/hooks/useDashboard';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function DashboardFilters({ filters, onChange }: Props) {
  const today = dayjs().format('YYYY-MM-DD');

  const setPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    switch (preset) {
      case 'today':
        onChange({ startDate: today, endDate: today, storeLocation: filters.storeLocation, mode: 'day' });
        break;
      case 'yesterday': {
        const y = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        onChange({ startDate: y, endDate: y, storeLocation: filters.storeLocation, mode: 'day' });
        break;
      }
      case 'week': {
        const start = dayjs().startOf('week').format('YYYY-MM-DD');
        onChange({ startDate: start, endDate: today, storeLocation: filters.storeLocation, mode: 'range' });
        break;
      }
      case 'month': {
        const start = dayjs().startOf('month').format('YYYY-MM-DD');
        onChange({ startDate: start, endDate: today, storeLocation: filters.storeLocation, mode: 'range' });
        break;
      }
    }
  };

  const isActive = (preset: string) => {
    switch (preset) {
      case 'today':
        return filters.startDate === today && filters.endDate === today;
      case 'yesterday': {
        const y = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        return filters.startDate === y && filters.endDate === y;
      }
      case 'week':
        return filters.startDate === dayjs().startOf('week').format('YYYY-MM-DD') && filters.endDate === today;
      case 'month':
        return filters.startDate === dayjs().startOf('month').format('YYYY-MM-DD') && filters.endDate === today;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Shift operations overview</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Quick presets */}
        <div className="flex items-center gap-1 mr-2">
          {(['today', 'yesterday', 'week', 'month'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setPreset(preset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isActive(preset)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : preset === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Date inputs */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              if (!e.target.value) return;
              const isSame = e.target.value === filters.endDate;
              onChange({ ...filters, startDate: e.target.value, mode: isSame ? 'day' : 'range' });
            }}
            className="input w-36 text-sm"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              if (!e.target.value) return;
              const isSame = filters.startDate === e.target.value;
              onChange({ ...filters, endDate: e.target.value, mode: isSame ? 'day' : 'range' });
            }}
            className="input w-36 text-sm"
          />
        </div>

        {/* Store filter */}
        <select
          value={filters.storeLocation}
          onChange={(e) => onChange({ ...filters, storeLocation: e.target.value })}
          className="select w-36 text-sm"
        >
          <option value="">All Stores</option>
          {STORE_LOCATIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
