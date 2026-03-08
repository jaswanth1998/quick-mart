export const TASK_SHIFT_TYPES = ['morning', 'evening'] as const;
export type TaskShiftType = (typeof TASK_SHIFT_TYPES)[number];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending', badge: 'badge-orange' },
  { value: 'approved', label: 'Approved', badge: 'badge-green' },
  { value: 'rejected', label: 'Rejected', badge: 'badge-red' },
] as const;

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
