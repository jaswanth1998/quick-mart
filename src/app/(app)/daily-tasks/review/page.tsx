'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { useTaskCompletions, useVerifyTask, type TaskCompletion } from '@/hooks/useTaskCompletions';
import { useToast } from '@/components/ui/Toast';
import { TaskReviewCard } from '@/components/daily-tasks/TaskReviewCard';
import { ImagePreviewModal } from '@/components/daily-tasks/ImagePreviewModal';
import { RejectTaskModal } from '@/components/daily-tasks/RejectTaskModal';
import { TASK_SHIFT_TYPES, VERIFICATION_STATUSES } from '@/lib/daily-tasks-constants';
import { STORE_LOCATIONS } from '@/lib/shift-report-constants';
import dayjs from 'dayjs';

export default function ReviewPage() {
  const { isLoading: authLoading } = useRequireAdmin();
  const toast = useToast();

  const [taskDate, setTaskDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [shiftFilter, setShiftFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectingTaskName, setRejectingTaskName] = useState('');

  const { data: completionsData, isLoading } = useTaskCompletions({
    taskDate,
    shiftType: shiftFilter || undefined,
    storeLocation: storeFilter || undefined,
    verificationStatus: statusFilter || undefined,
    search: search || undefined,
    page,
    pageSize: 12,
  });

  const verifyMutation = useVerifyTask();

  const handleApprove = async (id: number) => {
    try {
      await verifyMutation.mutateAsync({ id, verification_status: 'approved' });
      toast.success('Task approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = (completion: TaskCompletion) => {
    setRejectingId(completion.id);
    setRejectingTaskName(completion.task_templates?.task_name || 'Unknown Task');
  };

  const handleRejectConfirm = async (notes: string) => {
    if (!rejectingId) return;
    try {
      await verifyMutation.mutateAsync({ id: rejectingId, verification_status: 'rejected', admin_notes: notes });
      toast.success('Task rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const completions = completionsData?.data || [];
  const total = completionsData?.total || 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Review Task Submissions</h1>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input w-40" value={taskDate} onChange={(e) => { setTaskDate(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="select w-32" value={shiftFilter} onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }}>
              <option value="">All Shifts</option>
              {TASK_SHIFT_TYPES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Store</label>
            <select className="select w-32" value={storeFilter} onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}>
              <option value="">All Stores</option>
              {STORE_LOCATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select w-32" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              {VERIFICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-9 w-48"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : completions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No task submissions found for the selected filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} submission{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completions.map((completion) => (
              <TaskReviewCard
                key={completion.id}
                completion={completion}
                onImageClick={setPreviewImage}
                onApprove={handleApprove}
                onReject={() => handleReject(completion)}
                isApproving={verifyMutation.isPending}
              />
            ))}
          </div>

          {total > 12 && (
            <div className="flex justify-center gap-2">
              <button
                className="btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 flex items-center px-3">
                Page {page} of {Math.ceil(total / 12)}
              </span>
              <button
                className="btn-secondary btn-sm"
                disabled={page >= Math.ceil(total / 12)}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {previewImage && (
        <ImagePreviewModal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
        />
      )}

      <RejectTaskModal
        open={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onConfirm={handleRejectConfirm}
        taskName={rejectingTaskName}
      />
    </div>
  );
}
