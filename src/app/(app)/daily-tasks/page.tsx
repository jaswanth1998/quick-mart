'use client';

import { Loader2, ListTodo, Eye, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useTodayTaskStats } from '@/hooks/useTaskCompletions';
import { TaskStatsCards } from '@/components/daily-tasks/TaskStatsCards';
import dayjs from 'dayjs';

export default function DailyTasksPage() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');
  const { data: stats, isLoading: statsLoading } = useTodayTaskStats(today);

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
        </div>
        <div
          className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/daily-tasks/my-tasks')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ListTodo className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
              <p className="text-sm text-gray-500">View and complete today&apos;s assigned tasks</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Today: {dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
      </div>

      <TaskStatsCards
        total={stats?.total || 0}
        pending={stats?.pending || 0}
        approved={stats?.approved || 0}
        rejected={stats?.rejected || 0}
        isLoading={statsLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/daily-tasks/templates')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Templates</h2>
              <p className="text-sm text-gray-500">Create and edit task templates</p>
            </div>
          </div>
        </div>

        <div
          className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/daily-tasks/review')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Tasks</h2>
              <p className="text-sm text-gray-500">Approve or reject submitted tasks</p>
            </div>
          </div>
        </div>

        <div
          className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/daily-tasks/my-tasks')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ListTodo className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
              <p className="text-sm text-gray-500">View tasks as an employee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
