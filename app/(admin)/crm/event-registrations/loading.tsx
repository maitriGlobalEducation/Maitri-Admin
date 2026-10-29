export default function CRMLoading() {
  return (
    <section className="animate-pulse space-y-6">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-zinc-200" />
        <div className="h-4 w-80 max-w-full rounded bg-zinc-100" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="h-10 w-full rounded-xl bg-zinc-100 sm:max-w-sm" />
        <div className="h-4 w-28 rounded bg-zinc-100" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex gap-6 border-b border-zinc-100 bg-zinc-50 px-5 py-4">
          {[32, 40, 24, 24, 28].map((width, index) => (
            <div
              key={index}
              className="h-3 rounded bg-zinc-200"
              style={{ width: `${width * 2}px` }}
            />
          ))}
        </div>

        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-zinc-100 px-5 py-5 last:border-b-0"
          >
            <div className="h-4 w-32 shrink-0 rounded bg-zinc-100" />
            <div className="h-4 w-40 shrink-0 rounded bg-zinc-100" />
            <div className="h-4 w-24 shrink-0 rounded bg-zinc-100" />
            <div className="h-4 w-24 shrink-0 rounded bg-zinc-100" />
            <div className="h-4 w-28 shrink-0 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
