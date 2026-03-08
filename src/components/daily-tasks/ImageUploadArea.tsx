'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from '@/lib/daily-tasks-constants';

interface ImageUploadAreaProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string | null;
  onClear?: () => void;
  isUploading?: boolean;
  error?: string | null;
}

export function ImageUploadArea({ onFileSelect, previewUrl, onClear, isUploading, error }: ImageUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || localPreview;

  const handleFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  if (displayUrl) {
    return (
      <div className="relative">
        <img
          src={displayUrl}
          alt="Task proof"
          className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
        />
        {!isUploading && (
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
        `}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Drag & drop an image or <span className="text-blue-600 font-medium">click to browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPEG, PNG, or WebP - Max {MAX_IMAGE_SIZE_MB}MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
