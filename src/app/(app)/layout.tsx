'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/AppLayout';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { profile, isLoading } = useUserRole();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/');
      } else {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    });
  }, [supabase, router]);

  useEffect(() => {
    if (!isLoading && profile && !profile.is_active) {
      router.push('/');
    }
  }, [isLoading, profile, router]);

  if (!authChecked || !isAuthenticated || isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const role = profile.role ?? 'user';
  const username = profile.username ?? 'User';

  return (
    <AppLayout role={role} username={username}>
      {children}
    </AppLayout>
  );
}
