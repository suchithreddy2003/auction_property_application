'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signupAction } from '../actions';
import { Button, Card, Input, Label } from '@/components/ui';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating…' : 'Create account'}
    </Button>
  );
}

export default function SignupPage() {
  const [state, action] = useFormState(signupAction, { error: '' as string | undefined });
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Create account</h1>
        <p className="mb-6 text-sm text-gray-600">Free to browse. Subscribe later for full access.</p>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="password">Password (min 8 chars)</Label>
            <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-brand-700 hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
