import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { accountsEnabled, requireUser } from '@/server/auth';
import { getUserSettings } from '@/server/settings';
import { signOut } from '@/server/actions';
import DeleteAccountForm from './DeleteAccountForm';

export const metadata: Metadata = { title: 'Account · Moon Dashboard' };

const buttonClass =
  'min-h-[44px] px-4 rounded-lg border border-white/10 bg-white/5 text-sm text-silver hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40';

export default async function SettingsPage() {
  if (!accountsEnabled()) notFound();
  const user = await requireUser();
  const { timezone } = await getUserSettings(user.id);

  return (
    <main className="relative z-10 min-h-dvh px-4 sm:px-8 py-8 max-w-xl mx-auto w-full space-y-4">
      <Link href="/" className="inline-block text-sm text-text-secondary hover:text-foreground">
        ← Back to the moon
      </Link>

      <section className="card p-5 flex items-center gap-4">
        {user.image && (
          <Image src={user.image} alt="" width={48} height={48} className="rounded-full" />
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-wide text-foreground truncate">{user.name}</h1>
          <p className="text-xs text-text-tertiary">Signed in with Discord</p>
        </div>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-text-tertiary">Timezone</h2>
        {timezone ? (
          <p className="text-sm text-text-secondary">
            <span className="text-foreground">{timezone.replace(/_/g, ' ')}</span>, used on every device you sign in on.
            Change it from the dashboard.
          </p>
        ) : (
          <p className="text-sm text-text-secondary">
            Not chosen yet, so each device uses its own. Pick one on the dashboard to use it everywhere.
          </p>
        )}
      </section>

      <section className="card p-5 space-y-3">
        <form action={signOut}>
          <button type="submit" className={buttonClass}>Sign out</button>
        </form>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-text-tertiary">Delete account</h2>
        <p className="text-sm text-text-secondary">
          Removes your account and everything saved with it. This can&apos;t be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
