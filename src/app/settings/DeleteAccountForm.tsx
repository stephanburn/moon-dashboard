'use client';

import { announceAccountChange } from '@/lib/account';
import { deleteAccount } from '@/server/actions';

export default function DeleteAccountForm() {
  return (
    <form
      action={deleteAccount}
      onSubmit={e => {
        if (!window.confirm('Delete your account and everything saved with it?')) e.preventDefault();
        else announceAccountChange();
      }}
    >
      <button
        type="submit"
        className="min-h-[44px] px-4 rounded-lg border border-red-700/50 bg-red-950/40 text-sm text-red-300 hover:border-red-600/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
      >
        Delete my account
      </button>
    </form>
  );
}
