// ---------------------------------------------------------------------------
// EI-GAP — Report Loading Skeleton
// Story E5.S4 — Loading skeletons per report section
// Next.js convention: loading.tsx shows while page.tsx suspends
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className ?? ''}`}
      role="status"
      aria-label="Carregando..."
    />
  )
}

export default function ReportLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* ReportHeader skeleton */}
      <header className="mb-8 space-y-4" data-testid="skeleton-header">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
      </header>

      <div className="space-y-6">
        {/* LossAversion skeleton */}
        <section className="rounded-lg border border-gray-200 p-6" data-testid="skeleton-loss-aversion">
          <Skeleton className="mb-4 h-7 w-48" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-16 w-1/2" />
          </div>
        </section>

        {/* OpportunitiesTable skeleton */}
        <section className="rounded-lg border border-gray-200 p-6" data-testid="skeleton-opportunities">
          <Skeleton className="mb-4 h-7 w-56" />
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </section>

        {/* TopThreeDeepDive skeleton */}
        <section className="rounded-lg border border-gray-200 p-6" data-testid="skeleton-top-three">
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CostOfInaction skeleton */}
        <section className="rounded-lg border border-gray-200 p-6" data-testid="skeleton-cost-inaction">
          <Skeleton className="mb-4 h-7 w-52" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </section>

        {/* ReportCta skeleton */}
        <section className="rounded-lg border border-gray-200 p-6 text-center" data-testid="skeleton-cta">
          <Skeleton className="mx-auto mb-4 h-7 w-64" />
          <Skeleton className="mx-auto h-4 w-80" />
          <Skeleton className="mx-auto mt-4 h-12 w-48 rounded-lg" />
        </section>
      </div>
    </main>
  )
}
