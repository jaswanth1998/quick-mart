'use client';

import { Search, Download, Printer, Plus } from 'lucide-react';
import { STORE_LOCATIONS, SHIFT_TYPES } from '@/lib/shift-report-constants';
import * as XLSX from 'xlsx';
import { CashCountingEntry } from '@/lib/cash-counting-utils';

interface CashCountingHeaderProps {
  filters: {
    search: string;
    shiftType: string;
    storeLocation: string;
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (filters: {
    search: string;
    shiftType: string;
    storeLocation: string;
    startDate: string;
    endDate: string;
  }) => void;
  onAddEntry: () => void;
  entries?: CashCountingEntry[];
}

export default function CashCountingHeader({
  filters,
  onFiltersChange,
  onAddEntry,
  entries = [],
}: CashCountingHeaderProps) {
  const handleExport = () => {
    if (entries.length === 0) {
      alert('No data to export');
      return;
    }

    const data = entries.map(entry => ({
      Date: entry.entry_date,
      Shift: entry.shift_type,
      'Shift Incharge': entry.shift_incharge,
      'Store Location': entry.store_location,
      '$50': entry.bills_50,
      '$20': entry.bills_20,
      '$10': entry.bills_10,
      '$5': entry.bills_5,
      '$2': entry.bills_2,
      '$1': entry.bills_1,
      '25¢': entry.coins_25,
      '10¢': entry.coins_10,
      '5¢': entry.coins_5,
      'Total Amount': entry.total_amount,
      'Sale Drop': entry.sale_drop,
      'Remaining': entry.remaining,
      'Total Sale Drops': entry.total_sale_drops,
      'Status': entry.status,
      'Notes': entry.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Counting');
    XLSX.writeFile(workbook, `cash-counting-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="card">
      <div className="p-6 space-y-4">
        {/* Title and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cash Counting Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">Track and analyze cash counts per shift</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 no-print"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={onAddEntry}
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9 w-full"
              placeholder="Search by incharge or location..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Shift Type */}
          <div>
            <select
              className="select w-full"
              value={filters.shiftType}
              onChange={(e) => onFiltersChange({ ...filters, shiftType: e.target.value })}
            >
              <option value="">All Shifts</option>
              {SHIFT_TYPES.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>

          {/* Store Location */}
          <div>
            <select
              className="select w-full"
              value={filters.storeLocation}
              onChange={(e) => onFiltersChange({ ...filters, storeLocation: e.target.value })}
            >
              <option value="">All Locations</option>
              {STORE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              className="input w-full"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              className="input w-full"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
