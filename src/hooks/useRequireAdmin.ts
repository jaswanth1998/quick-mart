'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from './useUserRole';

export function useRequireAdmin() {
  const { isAdmin, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/todo');
    }
  }, [isAdmin, isLoading, router]);

  return { isAdmin, isLoading: isLoading || !isAdmin };
}
