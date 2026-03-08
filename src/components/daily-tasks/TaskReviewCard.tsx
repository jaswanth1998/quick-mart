'use client';

import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { DAYS_OF_WEEK, VERIFICATION_STATUSES } from '@/lib/daily-tasks-constants';
import type { TaskCompletion } from '@/hooks/useTaskCompletions';
import { formatDateTime } from '@/lib/utils';

interface TaskReviewCardProps {
  completion: TaskCompletion;
  onImageClick: (url: string) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving?: boolean;
}

export function TaskReviewCard({ completion, onImageClick, onApprove, onReject, isApproving }: TaskReviewCardProps) {
  const statusInfo = VERIFICATION_STATUSES.find(s => s.value === completion.verification_status);
  const dayLabel = DAYS_OF_WEEK.find(d => d.value === completion.task_templates?.day_of_week)?.label || '';
  const employeeName = completion.completed_by_profile?.username || completion.completed_by_profile?.email || 'Unknown';

  return (
    <div className="card overflow-hidden">
      <div
        className="h-48 bg-gray-100 cursor-pointer relative group"
        onClick={() => onImageClick(completion.image_url)}
      >
        <img
          src={completion.image_url}
          alt="Task proof"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-opacity">
            Click to enlarge
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{completion.task_templates?.task_name}</h3>
            <p className="text-sm text-gray-500">
              {dayLabel} &middot; {completion.task_templates?.shift_type} &middot; {completion.task_templates?.store_location}
            </p>
          </div>
          <span className={statusInfo?.badge || 'badge-gray'}>
            {completion.verification_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {completion.verification_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
            {completion.verification_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
            {statusInfo?.label}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>By: <span className="font-medium">{employeeName}</span></p>
          <p>Date: {completion.task_date}</p>
          <p>Submitted: {formatDateTime(completion.completed_at)}</p>
        </div>

        {completion.notes && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded p-2">
            {completion.notes}
          </p>
        )}

        {completion.verification_status === 'pending' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onApprove(completion.id)}
              disabled={isApproving}
              className="btn-sm flex-1 bg-green-600 text-white hover:bg-green-700 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => onReject(completion.id)}
              disabled={isApproving}
              className="btn-sm flex-1 bg-red-600 text-white hover:bg-red-700 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {completion.verification_status === 'rejected' && completion.admin_notes && (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">
            Rejection: {completion.admin_notes}
          </p>
        )}
      </div>
    </div>
  );
}
