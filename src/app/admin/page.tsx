import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEFAULT_TZ } from '@/lib/config';
import { dayOf } from '@/lib/days';
import { formatDay, formatDayAndTime } from '@/lib/format';
import { describeUserAgent } from '@/lib/userAgent';
import { revokeSessions } from '@/server/actions';
import { listMembers, recentSignIns } from '@/server/admin';
import { accountsEnabled, requireAdmin } from '@/server/auth';
import { getUserSettings } from '@/server/settings';

export const metadata: Metadata = { title: 'Admin · Moon Dashboard', robots: { index: false } };

export default async function AdminPage() {
  if (!accountsEnabled()) notFound();
  const admin = await requireAdmin();
  const [members, signIns, settings] = await Promise.all([
    listMembers(),
    recentSignIns(),
    getUserSettings(admin.id),
  ]);
  // Rendered on the server only (no client component re-renders these), in
  // the admin's own saved zone, so there is nothing to mismatch on hydration.
  const tz = settings.timezone ?? DEFAULT_TZ;
  const when = (instant: Date) => formatDayAndTime(instant, tz);
  const refused = signIns.filter(s => s.outcome === 'refused').length;

  return (
    <main className="relative z-10 min-h-dvh px-4 sm:px-8 py-8 max-w-2xl mx-auto w-full space-y-4">
      <Link href="/settings" className="inline-block text-sm text-text-secondary hover:text-foreground">
        ← Account
      </Link>
      <h1 className="font-display text-3xl tracking-wide text-foreground">Admin</h1>
      <p className="text-xs text-text-tertiary">Times in {tz.replace(/_/g, ' ')}.</p>

      <section className="card p-5 space-y-3" aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-xs uppercase tracking-widest text-text-tertiary">
          Members ({members.length})
        </h2>
        <ul className="divide-y divide-white/5">
          {members.map(m => (
            <li key={m.id} className="py-3 flex items-start gap-3">
              {m.image ? (
                <Image src={m.image} alt="" width={36} height={36} className="rounded-full flex-shrink-0" />
              ) : (
                <span aria-hidden className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
              )}
              <div className="min-w-0 text-sm">
                <p className="text-foreground">
                  {m.name}
                  {m.isAdmin && <span className="ml-2 text-xs text-amber-light">admin</span>}
                </p>
                <p className="text-xs text-text-secondary">
                  Joined {formatDay(dayOf(m.joinedAt, tz))}
                  {' · '}
                  {m.lastSeenAt ? `last seen ${when(m.lastSeenAt)}` : 'not seen since joining'}
                </p>
                <p className="text-xs text-text-tertiary">
                  {m.visits} {m.visits === 1 ? 'visit' : 'visits'} on {m.daysVisited} {m.daysVisited === 1 ? 'day' : 'days'}
                  {m.timezone && ` · ${m.timezone.replace(/_/g, ' ')}`}
                </p>
              </div>
              {m.activeSessions > 0 && (
                <form action={revokeSessions} className="ml-auto flex-shrink-0">
                  <input type="hidden" name="userId" value={m.id} />
                  <button
                    type="submit"
                    aria-label={`Sign out everywhere: ${m.name}`}
                    className="min-h-[44px] px-3 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-foreground hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
                  >
                    Sign out everywhere
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 space-y-3" aria-labelledby="signins-heading">
        <h2 id="signins-heading" className="text-xs uppercase tracking-widest text-text-tertiary">
          Sign-ins (last {signIns.length}{refused > 0 && `, ${refused} refused`})
        </h2>
        {signIns.length === 0 ? (
          <p className="text-sm text-text-secondary">None yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {signIns.map(s => (
              <li key={s.id} className="py-2.5 text-sm">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className={s.outcome === 'refused' ? 'text-red-300' : 'text-foreground'}>
                    {s.name ?? 'Unknown Discord account'}
                  </span>
                  {s.outcome === 'refused' && (
                    <span className="text-xs text-red-300/80">refused, not in the server</span>
                  )}
                  <span className="text-xs text-text-tertiary ml-auto">{when(s.at)}</span>
                </p>
                <p className="text-xs text-text-tertiary" title={s.userAgent ?? undefined}>
                  {describeUserAgent(s.userAgent)}
                  {s.ipAddress && ` · ${s.ipAddress}`}
                  {s.outcome === 'refused' && s.discordId && ` · Discord ID ${s.discordId}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
