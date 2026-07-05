'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button, Input, Label } from '@/components/ui';
import { changePasswordAction, updateProfileAction } from '@/app/(auth)/actions';

function ProfileSubmit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>;
}

type ProfileState = { ok?: boolean };

export function ProfileForm({
  defaults,
  email,
}: {
  defaults: { name: string; phone: string; marketingOptIn: boolean };
  email: string;
}) {
  const [state, action] = useFormState<ProfileState, FormData>(
    updateProfileAction as unknown as (state: ProfileState, fd: FormData) => Promise<ProfileState>,
    {}
  );
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaults.phone} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="marketingOptIn" defaultChecked={defaults.marketingOptIn} className="h-4 w-4" />
        Send me product updates and offers
      </label>
      {state?.ok && <p className="text-sm text-green-700">Profile updated.</p>}
      <ProfileSubmit />
    </form>
  );
}

function PasswordSubmit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</Button>;
}

type PasswordState = { error?: string; ok?: boolean };

export function PasswordForm() {
  const [state, action] = useFormState<PasswordState, FormData>(
    changePasswordAction as unknown as (state: PasswordState, fd: FormData) => Promise<PasswordState>,
    {}
  );
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Password updated.</p>}
      <PasswordSubmit />
    </form>
  );
}
