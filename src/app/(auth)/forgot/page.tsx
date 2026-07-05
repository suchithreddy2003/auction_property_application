'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { forgotPasswordAction } from '../actions';
import { Button, Card, Input, Label } from '@/components/ui';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Sending…' : 'Email reset link'}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useFormState(forgotPasswordAction, { ok: false as boolean | undefined });
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Forgot password</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your account email. If we have a match, you'll get a reset link.
        </p>
        {state?.ok ? (
          <div className="rounded-md bg-green-50 px-3 py-3 text-sm text-green-700">
            If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <SubmitButton />
          </form>
        )}
        <p className="mt-4 text-sm text-gray-600">
          Remembered it? <Link href="/login" className="text-brand-700 hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
