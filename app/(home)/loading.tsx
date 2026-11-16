export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl animate-pulse">
        {/* Header */}
        <header className="mb-12">
          {/* Brand badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <div className="size-3 rounded-full bg-zinc-200" />
            <div className="h-3 w-40 rounded bg-zinc-200" />
          </div>

          {/* Heading */}
          <div className="mb-3 h-3 w-40 rounded bg-zinc-200" />

          <div className="h-9 w-80 max-w-full rounded-lg bg-zinc-200 sm:h-10" />

          <div className="mt-4 space-y-2">
            <div className="h-3 w-full max-w-lg rounded bg-zinc-200" />
            <div className="h-3 w-3/4 max-w-sm rounded bg-zinc-200" />
          </div>
        </header>

        {/* Workspace Cards */}
        <section className="grid gap-5 md:grid-cols-2">
          {/* CMS Card */}
          <div className="flex min-h-80 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="size-12 rounded-xl bg-zinc-200" />

            <div className="mt-8">
              <div className="h-3 w-24 rounded bg-zinc-200" />
              <div className="mt-3 h-7 w-4/5 rounded bg-zinc-200" />

              <div className="mt-4 space-y-2">
                <div className="h-3 w-full max-w-sm rounded bg-zinc-200" />
                <div className="h-3 w-5/6 rounded bg-zinc-200" />
                <div className="h-3 w-2/3 rounded bg-zinc-200" />
              </div>
            </div>

            {/* Feature Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="h-7 w-28 rounded-lg bg-zinc-100" />
              <div className="h-7 w-20 rounded-lg bg-zinc-100" />
              <div className="h-7 w-28 rounded-lg bg-zinc-100" />
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-5">
              <div className="h-4 w-20 rounded bg-zinc-200" />
              <div className="size-9 rounded-full bg-zinc-200" />
            </div>
          </div>

          {/* CRM Card */}
          <div className="flex min-h-80 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="size-12 rounded-xl bg-zinc-200" />

            <div className="mt-8">
              <div className="h-3 w-24 rounded bg-zinc-200" />
              <div className="mt-3 h-7 w-4/5 rounded bg-zinc-200" />

              <div className="mt-4 space-y-2">
                <div className="h-3 w-full max-w-sm rounded bg-zinc-200" />
                <div className="h-3 w-5/6 rounded bg-zinc-200" />
                <div className="h-3 w-2/3 rounded bg-zinc-200" />
              </div>
            </div>

            {/* Feature Tag */}
            <div className="mt-6">
              <div className="h-9 w-52 max-w-full rounded-lg bg-zinc-100" />
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-5">
              <div className="h-4 w-20 rounded bg-zinc-200" />
              <div className="size-9 rounded-full bg-zinc-200" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-3 w-52 rounded bg-zinc-200" />
          <div className="h-3 w-36 rounded bg-zinc-200" />
        </footer>
      </div>
    </main>
  );
}
