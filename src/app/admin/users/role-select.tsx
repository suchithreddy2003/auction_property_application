'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Roles, type Role } from '@/types/enums';

export function RoleSelect({
  userId,
  current,
  disabled,
}: {
  userId: string;
  current: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(current);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function commit(next: Role) {
    setError(null);
    setValue(next);
    start(async () => {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: next }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || `Failed (${res.status})`);
        setValue(current);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        disabled={disabled || pending}
        value={value}
        onChange={(e) => commit(e.target.value as Role)}
        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs"
      >
        {Roles.map((r) => (
          <option key={r} value={r}>{r.replace('_', ' ')}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
