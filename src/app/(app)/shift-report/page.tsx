'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useShiftReports, useDeleteShiftReport } from '@/hooks/useShiftReports';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { useUserRole } from '@/hooks/useUserRole';
import { Eye, Pencil } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Dayjs } from 'dayjs';
import type { ShiftReport } from '@/hooks/useShiftReports';

export default function ShiftReportPage() {
  const router = useRouter();
  const toast = useToast();
  const { isAdmin } = useUserRole();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState<[Dayjs, Dayjs] | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: reportsData, isLoading } = useShiftReports({
    search,
    startDate: dateFilter?.[0]?.format('YYYY-MM-DD'),
    endDate: dateFilter?.[1]?.format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  const deleteMutation = useDeleteShiftReport();

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
      title: 'Location',
      dataIndex: 'store_location',
      key: 'store_location',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) =>
        value === 'draft' ? (
          <span className="badge-orange">Draft</span>
        ) : (
          <span className="badge-green">Submitted</span>
        ),
    },
    {
      title: 'Submitted At',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 180,
      render: (value) => (value ? formatDateTime(value as string) : '-'),
      sorter: (a, b) => {
        if (!a.submitted_at && !b.submitted_at) return 0;
        if (!a.submitted_at) return -1;
        if (!b.submitted_at) return 1;
        return (
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
        );
      },
    },
    {
      title: 'Actions',
      dataIndex: '_actions',
      key: '_actions',
      width: 120,
      exportable: false,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/shift-report/${record.id}`)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="View"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          {record.status === 'draft' && (
            <button
              onClick={() => router.push(`/shift-report/${record.id}`)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Shift report deleted successfully');
      setDeleteId(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete shift report'
      );
    }
  };

  const deleteRecord = reportsData?.data.find((r) => r.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shift Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage shift stock reports
        </p>
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
        actions={{
          onAdd: () => router.push('/shift-report/new/value-stock'),
          addLabel: 'New Report',
          ...(isAdmin
            ? {
                onDelete: (record: ShiftReport) => setDeleteId(record.id),
              }
            : {}),
        }}
        exportFileName="shift-reports"
      />

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Shift Report"
        message={`Are you sure you want to delete the shift report from ${
          deleteRecord
            ? formatDate(deleteRecord.report_date, 'MMM DD, YYYY')
            : ''
        } (${deleteRecord?.shift_type ?? ''})? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
