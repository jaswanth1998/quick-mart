'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface RejectTaskModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  taskName?: string;
}

export function RejectTaskModal({ open, onClose, onConfirm, taskName }: RejectTaskModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onConfirm(notes.trim());
      setNotes('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Task"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={handleConfirm} disabled={loading || !notes.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</> : 'Reject'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {taskName && (
          <p className="text-sm text-gray-600">
            Rejecting: <span className="font-medium text-gray-900">{taskName}</span>
          </p>
        )}
        <div>
          <label className="label">Reason for Rejection <span className="text-red-500">*</span></label>
          <textarea
            className="input"
            rows={3}
            placeholder="Explain why this task is being rejected..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
