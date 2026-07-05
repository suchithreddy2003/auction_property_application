'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { resetPasswordAction } from '../actions';
import { Button, Card, Input, Label } from '@/components/ui';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Resetting…' : 'Set new password'}
    </Button>
  );
}

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const [state, action] = useFormState(resetPasswordAction, { error: '' as string | undefined });
  const token = searchParams.token || '';
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm text-gray-600">Choose something you'll remember.</p>
        {!token ? (
          <p className="text-sm text-red-600">
            Missing reset token. Open the link from your email again.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <Label htmlFor="password">New password (min 8 chars)</Label>
              <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
            <SubmitButton />
          </form>
        )}
        <p className="mt-4 text-sm text-gray-600">
          <Link href="/login" className="text-brand-700 hover:underline">Back to sign in</Link>
        </p>
      </Card>
    </div>
  );
}
