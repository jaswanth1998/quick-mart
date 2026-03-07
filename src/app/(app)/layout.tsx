import { redirect } from 'next/navigation';
import { getUserWithProfile } from '@/lib/auth';
import { AppLayout } from '@/components/AppLayout';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithProfile();

  if (!user) {
    redirect('/');
  }

  if (user.profile && !user.profile.is_active) {
    redirect('/');
  }

  const role = user.profile?.role ?? 'user';
  const username = user.profile?.username ?? user.email ?? 'User';

  return (
    <AppLayout role={role} username={username}>
      {children}
    </AppLayout>
  );
}
