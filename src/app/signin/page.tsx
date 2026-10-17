import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { accountsEnabled, getCurrentUser } from '@/server/auth';
import { signInWithDiscord } from '@/server/actions';
import { LOG_RETENTION_DAYS } from '@/server/activity';

export const metadata: Metadata = { title: 'Sign in · Moon Dashboard' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!accountsEnabled()) notFound();
  if (await getCurrentUser()) redirect('/settings');
  const { error } = await searchParams;

  return (
    <main className="relative z-10 min-h-dvh flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6 space-y-5 text-center">
        <h1 className="font-display text-2xl tracking-wide text-foreground">Sign in</h1>
        <p className="text-sm text-text-secondary">
          Accounts are for members of our Discord server. Sign in with the Discord account you use there.
        </p>
        {error && (
          <p role="alert" className="text-sm text-amber-light">
            {error === 'unable_to_get_user_info'
              ? "That Discord account isn't in our server, or Discord couldn't confirm it. If you have more than one Discord account, check which one Discord shows on the next screen and switch if needed, then try again."
              : 'Sign-in didn\'t complete. Please try again.'}
          </p>
        )}
        <form action={signInWithDiscord}>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
          >
            Continue with Discord
          </button>
        </form>
        <p className="text-xs text-text-tertiary text-left">
          What&apos;s recorded: your Discord name and avatar; each sign-in attempt, including refused ones, with
          its time, IP address and browser; and how many times a day you visit. These logs are deleted after{' '}
          {LOG_RETENTION_DAYS} days. Deleting your account removes everything tied to it.
        </p>
        <p className="text-xs text-text-tertiary">
          The dashboard works without an account. <Link href="/" className="underline hover:text-text-secondary">Back to the moon</Link>
        </p>
      </div>
    </main>
  );
}
