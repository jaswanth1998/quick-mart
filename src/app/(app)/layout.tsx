import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { AppLayout } from '@/components/AppLayout';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return <AppLayout>{children}</AppLayout>;
}
