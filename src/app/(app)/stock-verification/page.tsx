'use client';

import { useState, useMemo } from 'react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  useShiftReports,
  useShiftReport,
  useVerifyShiftReport,
} from '@/hooks/useShiftReports';
import { useToast } from '@/components/ui/Toast';
import { FlagReportModal } from '@/components/verification/FlagReportModal';
import {
  ArrowLeft,
  CheckCircle,
  Flag,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Dayjs } from 'dayjs';
import type { ShiftReport } from '@/hooks/useShiftReports';

type VerificationFilter = 'all' | 'pending' | 'verified' | 'flagged';

function sumCommaSeparated(input: string): number | null {
  if (!input.trim()) return null;
  const nums = input
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
    .map(Number);
  if (nums.some(isNaN)) return null;
  return nums.reduce((s, n) => s + n, 0);
}

function StockComparisonSection({
  title,
  items,
  inputs,
  onInputChange,
}: {
  title: string;
  items: { label: string; expected: number }[];
  inputs: Record<string, string>;
  onInputChange: (label: string, value: string) => void;
}) {
  const rows = items.map((item) => {
    const raw = inputs[item.label] ?? '';
    const total = sumCommaSeparated(raw);
    const diff = total !== null ? total - item.expected : null;
    return { ...item, raw, total, diff };
  });

  const hasAnyInput = rows.some((r) => r.total !== null);

  const totalExpected = items.reduce((s, i) => s + i.expected, 0);
  const totalActual = hasAnyInput
    ? rows.reduce((s, r) => s + (r.total ?? 0), 0)
    : null;
  const totalDiff = totalActual !== null ? totalActual - totalExpected : null;

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">
          Enter comma-separated values for each item (e.g. 2, 5, 10 = 17)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                Expected
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Count
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Diff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const match = row.diff === 0;
              const hasDiff = row.diff !== null && row.diff !== 0;
              return (
                <tr
                  key={row.label}
                  className={
                    hasDiff
                      ? 'bg-red-50'
                      : match
                        ? 'bg-green-50'
                        : ''
                  }
                >
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {row.expected}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="input text-sm"
                      placeholder="e.g. 2, 5, 10"
                      value={row.raw}
                      onChange={(e) => onInputChange(row.label, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                    {row.total !== null ? row.total : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-semibold">
                    {row.diff !== null ? (
                      <span className={row.diff === 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {hasAnyInput && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                  {totalExpected}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                  {totalActual}
                </td>
                <td className="px-4 py-3 text-sm text-center font-bold">
                  {totalDiff !== null ? (
                    <span className={totalDiff === 0 ? 'text-green-600' : 'text-red-600'}>
                      {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function VerificationWorkspace({
  reportId,
  onBack,
}: {
  reportId: number;
  onBack: () => void;
}) {
  const toast = useToast();
  const { data: report, isLoading } = useShiftReport(reportId);
  const verifyMutation = useVerifyShiftReport();

  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});
  const [drawerInputs, setDrawerInputs] = useState<Record<string, string>>({});
  const [showFlagModal, setShowFlagModal] = useState(false);

  const valueItems = useMemo(
    () =>
      (report?.value_stock_entries || []).map((e) => ({
        label: e.amount_label,
        expected: e.end_count_override ?? e.end_count,
      })),
    [report?.value_stock_entries]
  );

  const drawerItems = useMemo(
    () =>
      (report?.drawer_stock_entries || []).map((e) => ({
        label: `#${e.drawer_number} ${e.contents}`,
        expected: e.closing_override ?? e.closing,
      })),
    [report?.drawer_stock_entries]
  );

  const getTotal = (inputs: Record<string, string>, label: string) =>
    sumCommaSeparated(inputs[label] ?? '');

  const hasAnyCounts = useMemo(() => {
    return (
      valueItems.some((item) => getTotal(valueInputs, item.label) !== null) ||
      drawerItems.some((item) => getTotal(drawerInputs, item.label) !== null)
    );
  }, [valueInputs, drawerInputs, valueItems, drawerItems]);

  const allMatch = useMemo(() => {
    if (!hasAnyCounts) return false;
    const valueOk = valueItems.every(
      (item) => getTotal(valueInputs, item.label) === item.expected
    );
    const drawerOk = drawerItems.every(
      (item) => getTotal(drawerInputs, item.label) === item.expected
    );
    return valueOk && drawerOk;
  }, [hasAnyCounts, valueInputs, drawerInputs, valueItems, drawerItems]);

  const handleVerify = async () => {
    try {
      const notes = buildSummaryNotes();
      await verifyMutation.mutateAsync({
        id: reportId,
        verification_status: 'verified',
        verification_notes: notes || undefined,
      });
      toast.success('Report verified successfully');
      onBack();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify report'
      );
    }
  };

  const handleFlag = async (notes: string) => {
    try {
      await verifyMutation.mutateAsync({
        id: reportId,
        verification_status: 'flagged',
        verification_notes: notes,
      });
      toast.success('Report flagged successfully');
      onBack();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to flag report'
      );
    }
  };

  function buildSummaryNotes(): string {
    const diffs: string[] = [];
    const checkItems = (items: { label: string; expected: number }[], inputs: Record<string, string>) => {
      items.forEach((item) => {
        const counted = getTotal(inputs, item.label);
        if (counted !== null && counted !== item.expected) {
          const d = counted - item.expected;
          diffs.push(`${item.label}: expected ${item.expected}, counted ${counted} (${d > 0 ? '+' : ''}${d})`);
        }
      });
    };
    checkItems(valueItems, valueInputs);
    checkItems(drawerItems, drawerInputs);
    if (diffs.length === 0) return 'All counts match.';
    return `Discrepancies found:\n${diffs.join('\n')}`;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">Report not found.</p>
        <button onClick={onBack} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const reportLabel = `${formatDate(report.report_date, 'MMM DD, YYYY')} — ${report.shift_type} — ${report.store_location}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Stock</h1>
        <p className="text-sm text-gray-500 mt-1">{reportLabel}</p>
        <p className="text-sm text-gray-500">
          Incharge: {report.shift_incharge}
        </p>
      </div>

      {/* Value Stock */}
      {valueItems.length > 0 && (
        <StockComparisonSection
          title="Value Stock"
          items={valueItems}
          inputs={valueInputs}
          onInputChange={(label, value) =>
            setValueInputs((prev) => ({ ...prev, [label]: value }))
          }
        />
      )}

      {/* Drawer Stock */}
      {drawerItems.length > 0 && (
        <StockComparisonSection
          title="Drawer Stock"
          items={drawerItems}
          inputs={drawerInputs}
          onInputChange={(label, value) =>
            setDrawerInputs((prev) => ({ ...prev, [label]: value }))
          }
        />
      )}

      {/* Action buttons */}
      {hasAnyCounts && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={verifyMutation.isPending}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {verifyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {allMatch ? 'Verify — All Counts Match' : 'Verify Anyway'}
          </button>
          <button
            onClick={() => setShowFlagModal(true)}
            className="btn-danger inline-flex items-center gap-2"
          >
            <Flag className="w-4 h-4" />
            Flag Report
          </button>
        </div>
      )}

      <FlagReportModal
        open={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        onConfirm={handleFlag}
        reportInfo={reportLabel}
      />
    </div>
  );
}

export default function StockVerificationPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState<[Dayjs, Dayjs] | undefined>();
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>('all');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const { data: reportsData, isLoading } = useShiftReports({
    search,
    status: 'submitted',
    verificationStatus:
      verificationFilter === 'all' ? undefined : verificationFilter,
    startDate: dateFilter?.[0]?.format('YYYY-MM-DD'),
    endDate: dateFilter?.[1]?.format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  // If a report is selected, show the verification workspace
  if (selectedReportId !== null) {
    return (
      <VerificationWorkspace
        reportId={selectedReportId}
        onBack={() => setSelectedReportId(null)}
      />
    );
  }

  const columns: DataTableColumn<ShiftReport>[] = [
    {
      title: 'Date',
      dataIndex: 'report_date',
      key: 'report_date',
      width: 120,
      render: (value) => formatDate(value as string, 'MMM DD, YYYY'),
      sorter: (a, b) =>
        new Date(a.report_date).getTime() - new Date(b.report_date).getTime(),
    },
    {
      title: 'Shift',
      dataIndex: 'shift_type',
      key: 'shift_type',
      width: 100,
    },
    {
      title: 'Incharge',
      dataIndex: 'shift_incharge',
      key: 'shift_incharge',
      ellipsis: true,
    },
    {
      title: 'Store',
      dataIndex: 'store_location',
      key: 'store_location',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'verification_status',
      key: 'verification_status',
      width: 110,
      render: (value) => {
        switch (value) {
          case 'verified':
            return <span className="badge-green">Verified</span>;
          case 'flagged':
            return <span className="badge-red">Flagged</span>;
          default:
            return <span className="badge-orange">Pending</span>;
        }
      },
    },
    {
      title: 'Notes',
      dataIndex: 'verification_notes',
      key: 'verification_notes',
      ellipsis: true,
      render: (value) => (value ? (value as string) : '-'),
    },
    {
      title: 'Actions',
      dataIndex: '_actions',
      key: '_actions',
      width: 100,
      exportable: false,
      render: (_, record) => (
        <button
          onClick={() => setSelectedReportId(record.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Verify
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Stock Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a submitted shift report to verify stock counts
        </p>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Verification Status
          </label>
          <select
            className="input w-48"
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value as VerificationFilter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      <DataTable<ShiftReport>
        columns={columns}
        data={reportsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: reportsData?.total || 0,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        search={{
          placeholder: 'Search by incharge or location...',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        dateFilter={{
          value: dateFilter,
          onChange: (dates) => {
            setDateFilter(dates ?? undefined);
            setPage(1);
          },
        }}
        exportFileName="stock-verification"
      />
    </div>
  );
}
