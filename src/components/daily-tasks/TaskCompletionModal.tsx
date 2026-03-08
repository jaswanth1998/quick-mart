'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ImageUploadArea } from './ImageUploadArea';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useCreateTaskCompletion, useUpdateTaskCompletion, type TaskCompletion } from '@/hooks/useTaskCompletions';
import type { TaskTemplate } from '@/hooks/useTaskTemplates';

interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  template: TaskTemplate;
  taskDate: string;
  userId: string;
  existingCompletion?: TaskCompletion | null;
  onSuccess: () => void;
}

export function TaskCompletionModal({
  open,
  onClose,
  template,
  taskDate,
  userId,
  existingCompletion,
  onSuccess,
}: TaskCompletionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(existingCompletion?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { uploadImage, isUploading, error: uploadError } = useImageUpload();
  const createCompletion = useCreateTaskCompletion();
  const updateCompletion = useUpdateTaskCompletion();

  const isResubmit = !!existingCompletion;

  const handleSubmit = async () => {
    if (!file && !isResubmit) {
      setSubmitError('Please upload a photo as proof.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let imageUrl = existingCompletion?.image_url || '';

      if (file) {
        imageUrl = await uploadImage(file);
      }

      if (isResubmit && existingCompletion) {
        await updateCompletion.mutateAsync({
          id: existingCompletion.id,
          image_url: imageUrl,
          notes: notes || null,
          verification_status: 'pending',
          admin_notes: null,
        });
      } else {
        await createCompletion.mutateAsync({
          template_id: template.id,
          task_date: taskDate,
          completed_by: userId,
          image_url: imageUrl,
          notes: notes || undefined,
        });
      }

      setFile(null);
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isUploading || submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isResubmit ? 'Re-submit Task' : 'Complete Task'}
      width="max-w-lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : (isResubmit ? 'Re-submit' : 'Submit')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-900">{template.task_name}</h4>
          {template.description && (
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          )}
        </div>

        <div>
          <label className="label">Photo Proof <span className="text-red-500">*</span></label>
          <ImageUploadArea
            onFileSelect={setFile}
            previewUrl={!file && isResubmit ? existingCompletion?.image_url : undefined}
            onClear={() => setFile(null)}
            isUploading={isUploading}
            error={uploadError}
          />
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </div>
    </Modal>
  );
}
