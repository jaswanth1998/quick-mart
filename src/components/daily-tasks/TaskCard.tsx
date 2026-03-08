'use client';

import { CheckCircle, Clock, XCircle, Camera, RotateCcw } from 'lucide-react';
import type { TaskTemplate } from '@/hooks/useTaskTemplates';
import type { TaskCompletion } from '@/hooks/useTaskCompletions';

interface TaskCardProps {
  template: TaskTemplate;
  completion?: TaskCompletion | null;
  isCurrentUser: boolean;
  onComplete: () => void;
  onResubmit?: () => void;
  onImageClick?: (url: string) => void;
}

export function TaskCard({ template, completion, isCurrentUser, onComplete, onResubmit, onImageClick }: TaskCardProps) {
  const getStatus = () => {
    if (!completion) return 'not_done';
    if (!isCurrentUser) return 'claimed';
    return completion.verification_status;
  };

  const status = getStatus();

  const statusConfig = {
    not_done: { badge: 'badge-gray', label: 'Not Done', icon: null },
    claimed: { badge: 'badge-gray', label: `Done by ${completion?.completed_by_profile?.username || completion?.completed_by_profile?.email || 'another user'}`, icon: CheckCircle },
    pending: { badge: 'badge-orange', label: 'Pending Review', icon: Clock },
    approved: { badge: 'badge-green', label: 'Approved', icon: CheckCircle },
    rejected: { badge: 'badge-red', label: 'Rejected', icon: XCircle },
  };

  const config = statusConfig[status];

  return (
    <div className={`card p-4 transition-all ${status === 'approved' ? 'border-l-4 border-l-green-500' : status === 'rejected' ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{template.task_name}</h3>
            <span className={config.badge}>
              {config.icon && <config.icon className="w-3 h-3 mr-1" />}
              {config.label}
            </span>
          </div>
          {template.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
          )}
          {status === 'rejected' && completion?.admin_notes && (
            <p className="text-sm text-red-600 mt-2 bg-red-50 rounded p-2">
              Rejection reason: {completion.admin_notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isCurrentUser && completion?.image_url && (
            <button
              onClick={() => onImageClick?.(completion.image_url)}
              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors flex-shrink-0"
            >
              <img src={completion.image_url} alt="Proof" className="w-full h-full object-cover" />
            </button>
          )}

          {status === 'not_done' && (
            <button onClick={onComplete} className="btn-primary btn-sm flex items-center gap-1">
              <Camera className="w-4 h-4" />
              Complete
            </button>
          )}

          {status === 'rejected' && isCurrentUser && (
            <button onClick={onResubmit} className="btn-primary btn-sm flex items-center gap-1">
              <RotateCcw className="w-4 h-4" />
              Re-submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
