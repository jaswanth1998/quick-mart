'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface FlagReportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  reportInfo?: string;
}

export function FlagReportModal({ open, onClose, onConfirm, reportInfo }: FlagReportModalProps) {
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
      title="Flag Report"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={handleConfirm} disabled={loading || !notes.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Flagging...</> : 'Flag Report'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {reportInfo && (
          <p className="text-sm text-gray-600">
            Report: <span className="font-medium text-gray-900">{reportInfo}</span>
          </p>
        )}
        <div>
          <label className="label">What&apos;s wrong? <span className="text-red-500">*</span></label>
          <textarea
            className="input"
            rows={3}
            placeholder="Describe what's missing or incorrect (e.g., 3 items missing from drawer #5)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
