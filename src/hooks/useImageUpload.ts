import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from '@/lib/daily-tasks-constants';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      const msg = 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
      setError(msg);
      throw new Error(msg);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const msg = `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`;
      setError(msg);
      throw new Error(msg);
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('task-proofs')
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('task-proofs')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
}
