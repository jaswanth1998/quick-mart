'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import dayjs from 'dayjs';
import type { RecentReport } from '@/hooks/useDashboard';

interface Props {
  reports: RecentReport[];
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return '--';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RecentReportsTable({ reports }: Props) {
  const router = useRouter();

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Recent Shift Reports</h3>
        </div>
        <Link href="/shift-report" className="text-xs text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">In-charge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">D-Sales</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift Sales</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Drawer Sold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No shift reports yet
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => router.push(`/shift-report/view?id=${report.id}`)}
                  className="hover:bg-gray-50/50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {dayjs(report.reportDate).format('MMM DD, YYYY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{report.shiftType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{report.storeLocation}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{report.shiftIncharge}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${report.status === 'submitted' ? 'badge-green' : 'badge-orange'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(report.totalDSales)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(report.shiftSales)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(report.totalDrawerSold)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
