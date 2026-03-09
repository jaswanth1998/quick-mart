'use client';

import { useState } from 'react';
import { Loader2, CalendarDays } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useTaskTemplatesForDay } from '@/hooks/useTaskTemplates';
import { useTodayCompletions } from '@/hooks/useTaskCompletions';
import { TaskCard } from '@/components/daily-tasks/TaskCard';
import { TaskCompletionModal } from '@/components/daily-tasks/TaskCompletionModal';
import { ImagePreviewModal } from '@/components/daily-tasks/ImagePreviewModal';
import { useToast } from '@/components/ui/Toast';
import { TASK_SHIFT_TYPES } from '@/lib/daily-tasks-constants';
import { STORE_LOCATIONS } from '@/lib/shift-report-constants';
import type { TaskTemplate } from '@/hooks/useTaskTemplates';
import type { TaskCompletion } from '@/hooks/useTaskCompletions';
import dayjs from 'dayjs';

export default function MyTasksPage() {
  const { profile, isLoading: authLoading } = useUserRole();
  const toast = useToast();

  const today = dayjs();
  const dayOfWeek = today.day();
  const todayDate = today.format('YYYY-MM-DD');

  const [shiftType, setShiftType] = useState<string>('morning');
  const [storeLocation, setStoreLocation] = useState<string>('4403 Kingston');
  const [completingTemplate, setCompletingTemplate] = useState<TaskTemplate | null>(null);
  const [resubmitCompletion, setResubmitCompletion] = useState<TaskCompletion | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: templates, isLoading: templatesLoading } = useTaskTemplatesForDay(dayOfWeek, shiftType, storeLocation);
  const { data: completions, isLoading: completionsLoading } = useTodayCompletions(todayDate, shiftType, storeLocation);

  const isLoading = authLoading || templatesLoading || completionsLoading;

  const getCompletionForTemplate = (templateId: number): TaskCompletion | undefined => {
    return completions?.find(c => c.template_id === templateId);
  };

  const handleComplete = (template: TaskTemplate) => {
    setResubmitCompletion(null);
    setCompletingTemplate(template);
  };

  const handleResubmit = (template: TaskTemplate, completion: TaskCompletion) => {
    setResubmitCompletion(completion);
    setCompletingTemplate(template);
  };

  const handleSuccess = () => {
    toast.success('Task submitted successfully');
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const taskList = templates || [];
  const completedCount = taskList.filter(t => getCompletionForTemplate(t.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <CalendarDays className="w-4 h-4" />
            {today.format('dddd, MMMM D, YYYY')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select w-32"
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
          >
            {TASK_SHIFT_TYPES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            className="select w-32"
            value={storeLocation}
            onChange={(e) => setStoreLocation(e.target.value)}
          >
            {STORE_LOCATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {taskList.length > 0 && (
        <div className="card p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{completedCount} / {taskList.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${taskList.length > 0 ? (completedCount / taskList.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : taskList.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No tasks assigned for this shift and store today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taskList.map((template) => {
            const completion = getCompletionForTemplate(template.id);
            const isCurrentUser = completion?.completed_by === profile?.id;

            return (
              <TaskCard
                key={template.id}
                template={template}
                completion={completion || null}
                isCurrentUser={isCurrentUser}
                onComplete={() => handleComplete(template)}
                onResubmit={() => completion && handleResubmit(template, completion)}
                onImageClick={setPreviewImage}
              />
            );
          })}
        </div>
      )}

      {completingTemplate && profile && (
        <TaskCompletionModal
          open={!!completingTemplate}
          onClose={() => { setCompletingTemplate(null); setResubmitCompletion(null); }}
          template={completingTemplate}
          taskDate={todayDate}
          userId={profile.id}
          existingCompletion={resubmitCompletion}
          onSuccess={handleSuccess}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
        />
      )}
    </div>
  );
}
