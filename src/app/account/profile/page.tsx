import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Card } from '@/components/ui';
import { ProfileForm, PasswordForm } from './forms';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/account/profile');
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <div>
        <Link href="/account" className="text-sm text-brand-700 hover:underline">← Account</Link>
        <h1 className="mt-2 text-3xl font-bold">Profile</h1>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Your details</h2>
        <ProfileForm
          defaults={{
            name: user.name ?? '',
            phone: user.phone ?? '',
            marketingOptIn: user.marketingOptIn,
          }}
          email={user.email}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Change password</h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
