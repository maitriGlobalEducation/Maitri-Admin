export default function Loading() {
  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
        {/* Header */}
        <div>
          <div className="mb-5 h-7 w-52 rounded-full bg-zinc-200" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="h-10 w-64 rounded-lg bg-zinc-200" />
              <div className="h-4 w-80 max-w-full rounded bg-zinc-200" />
            </div>

            <div className="h-10 w-28 rounded-lg bg-zinc-200" />
          </div>

          <div className="mt-6 h-px bg-zinc-200" />
        </div>

        {/* Overview statistics */}
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-zinc-200" />
            <div className="h-4 w-64 rounded bg-zinc-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#eaecf0] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-zinc-200" />
                  <div className="size-10 rounded-xl bg-zinc-200" />
                </div>

                <div className="mt-5 h-9 w-20 rounded bg-zinc-200" />
                <div className="mt-2 h-3 w-36 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </section>

        {/* All Leads */}
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-zinc-200" />
            <div className="h-4 w-80 max-w-full rounded bg-zinc-200" />
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#eaecf0] bg-white p-5">
            <div className="size-12 shrink-0 rounded-xl bg-zinc-200" />

            <div className="flex-1 space-y-3">
              <div className="h-4 w-28 rounded bg-zinc-200" />
              <div className="h-3 w-56 max-w-full rounded bg-zinc-100" />
              <div className="h-7 w-16 rounded bg-zinc-200" />
            </div>

            <div className="size-5 rounded bg-zinc-200" />
          </div>
        </section>

        {/* Recent Leads */}
        <section className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white">
          <div className="border-b border-[#eaecf0] px-5 py-4 sm:px-6">
            <div className="h-5 w-32 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-64 max-w-full rounded bg-zinc-100" />
          </div>

          <div className="divide-y divide-[#f2f4f7]">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6"
              >
                <div className="size-10 shrink-0 rounded-xl bg-zinc-200" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-36 max-w-full rounded bg-zinc-200" />
                  <div className="h-3 w-48 max-w-full rounded bg-zinc-100" />
                </div>

                <div className="h-6 w-24 rounded-full bg-zinc-200" />
                <div className="h-3 w-28 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="flex justify-between border-t border-[#eaecf0] pt-5">
          <div className="h-3 w-64 rounded bg-zinc-200" />
          <div className="h-3 w-24 rounded bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}
