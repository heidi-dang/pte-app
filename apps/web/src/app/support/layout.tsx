import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes('support') && !user.roles.includes('admin'))) {
    redirect('/permission-denied');
  }
  return <>{children}</>;
}
