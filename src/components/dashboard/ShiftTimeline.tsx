'use client';

import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, FileEdit, Circle } from 'lucide-react';
import type { ShiftStatus } from '@/hooks/useDashboard';

interface Props {
  shifts: ShiftStatus[];
}

const SHIFT_LABELS: Record<string, string> = {
  '7-3': '7 AM - 3 PM',
  '3-11': '3 PM - 11 PM',
  '11-7': '11 PM - 7 AM',
};

export default function ShiftTimeline({ shifts }: Props) {
  const router = useRouter();

  if (shifts.length === 0) return null;

  const handleClick = (shift: ShiftStatus) => {
    if (shift.reportId) {
      router.push(`/shift-report/view?id=${shift.reportId}`);
    } else {
      router.push('/shift-report/new/value-stock');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {shifts.map((shift) => {
        const isSubmitted = shift.reportStatus === 'submitted';
        const isDraft = shift.reportStatus === 'draft';

        let borderColor = 'border-gray-200';
        let bgColor = 'bg-white';
        let StatusIcon = Circle;
        let statusText = 'Not Started';
        let statusClass = 'text-gray-400';
        let badgeClass = 'badge-gray';

        if (isSubmitted) {
          borderColor = 'border-green-200';
          bgColor = 'bg-green-50/50';
          StatusIcon = CheckCircle;
          statusText = 'Submitted';
          statusClass = 'text-green-600';
          badgeClass = 'badge-green';
        } else if (isDraft) {
          borderColor = 'border-amber-200';
          bgColor = 'bg-amber-50/50';
          StatusIcon = FileEdit;
          statusText = 'Draft';
          statusClass = 'text-amber-600';
          badgeClass = 'badge-orange';
        }

        return (
          <button
            key={shift.shiftType}
            onClick={() => handleClick(shift)}
            className={`card ${bgColor} ${borderColor} p-4 text-left hover:shadow-md transition-all cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">{shift.shiftType}</span>
              </div>
              <span className={`badge ${badgeClass}`}>
                <StatusIcon className={`w-3 h-3 mr-1 ${statusClass}`} />
                {statusText}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{SHIFT_LABELS[shift.shiftType]}</p>
            <p className="text-sm text-gray-700">
              {shift.incharge ? `In-charge: ${shift.incharge}` : 'No report yet'}
            </p>
          </button>
        );
      })}
    </div>
  );
}
