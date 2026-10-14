import Image from 'next/image';
import Link from 'next/link';
import type { AccountUser } from '@/lib/account';

// Header link to the account page for a signed-in user.
export default function AccountButton({ user }: { user: AccountUser }) {
  return (
    <Link
      href="/settings"
      aria-label={`Account: ${user.name}`}
      className="fade-in flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
    >
      {user.image ? (
        <Image src={user.image} alt="" width={28} height={28} className="rounded-full border border-white/10" />
      ) : (
        <span aria-hidden className="w-7 h-7 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs text-silver">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </Link>
  );
}
