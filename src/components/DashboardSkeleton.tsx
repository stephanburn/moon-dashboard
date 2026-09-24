// What the server renders, and what the browser shows until the first client
// computation. It contains no dates, times or phase names, so server and client
// HTML are identical and hydration can't mismatch (review finding P0-2). Sizes
// mirror the real layout so nothing jumps when the content arrives.

const SPINE_ROWS = 8;

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-full bg-white/5 ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Calculating the sky" className="space-y-4">
      <section className="space-y-1">
        <div className="text-center space-y-4 px-4 pt-2 pb-2">
          <div className="inline-flex items-center justify-center">
            <span className="block w-[150px] sm:w-[190px] lg:w-[230px] aspect-square rounded-full bg-white/[0.03] border border-white/5" />
          </div>
          <div className="space-y-3 flex flex-col items-center">
            <Bar className="h-10 sm:h-12 w-56" />
            <Bar className="h-4 w-64" />
            <span className="block h-6" />
          </div>
        </div>
        <div className="min-h-[44px] flex items-center justify-center">
          <Bar className="h-3 w-32" />
        </div>
      </section>

      <div className="border-t border-white/5" />

      <section className="pt-2">
        <div className="card mx-auto w-full p-5 sm:p-6 space-y-4">
          <Bar className="h-3 w-24" />
          <Bar className="h-5 w-48" />
          {Array.from({ length: SPINE_ROWS }, (_, i) => (
            <div key={i} className="min-h-[44px] flex items-center gap-3 pl-9">
              <Bar className="h-4 w-6" />
              <Bar className="h-4 flex-1" />
              <Bar className="h-3 w-14" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
