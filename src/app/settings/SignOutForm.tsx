'use client';

import { announceAccountChange } from '@/lib/account';
import { signOut } from '@/server/actions';

// Tells other open tabs, so their dashboards drop the account too.
export default function SignOutForm({ buttonClass }: { buttonClass: string }) {
  return (
    <form action={signOut} onSubmit={() => announceAccountChange()}>
      <button type="submit" className={buttonClass}>Sign out</button>
    </form>
  );
}
