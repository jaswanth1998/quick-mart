'use client';

import { Modal } from '@/components/ui/Modal';

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export function ImagePreviewModal({ open, onClose, imageUrl, title = 'Task Proof' }: ImagePreviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-3xl">
      <div className="flex items-center justify-center">
        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      </div>
    </Modal>
  );
}
