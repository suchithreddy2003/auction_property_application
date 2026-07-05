'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';
import { Button, Card, Input, Label } from '@/components/ui';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string; reset?: string } }) {
  const [state, action] = useFormState(loginAction, { error: '' as string | undefined });
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-gray-600">Welcome back.</p>
        {searchParams.reset === '1' && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Password reset successful. Sign in with your new password.
          </p>
        )}
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={searchParams.next || ''} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <Link href="/forgot" className="text-brand-700 hover:underline">Forgot password?</Link>
          <Link href="/signup" className="text-brand-700 hover:underline">Sign up</Link>
        </div>
      </Card>
    </div>
  );
}
