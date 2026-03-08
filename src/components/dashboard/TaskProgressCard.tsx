'use client';

import Link from 'next/link';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import type { TaskProgress } from '@/hooks/useDashboard';

interface Props {
  progress: TaskProgress;
}

export default function TaskProgressCard({ progress }: Props) {
  const { totalTasks, completed, pendingVerification, approved, rejected } = progress;
  const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Daily Tasks</h3>
        </div>
        {pendingVerification > 0 && (
          <Link
            href="/daily-tasks/review"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {pendingVerification} to review <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {totalTasks === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No tasks scheduled for today</p>
          <Link href="/daily-tasks/templates" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
            Manage Templates <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </div>
      ) : (
        <div className="p-5">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Completion</span>
              <span className="text-sm font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completed} of {totalTasks} tasks completed
            </p>
          </div>

          {/* Status badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{approved}</p>
              <p className="text-xs text-green-700">Approved</p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{pendingVerification}</p>
              <p className="text-xs text-orange-700">Pending</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <p className="text-lg font-bold text-red-600">{rejected}</p>
              <p className="text-xs text-red-700">Rejected</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
