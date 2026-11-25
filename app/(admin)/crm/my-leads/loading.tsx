export default function Loading() {
  return (
    <section className="space-y-7 animate-pulse">
      {/* Page heading */}
      <div>
        <div className="h-4 w-56 rounded bg-zinc-200" />

        <div className="mt-3 h-9 w-40 rounded-lg bg-zinc-200" />

        <div className="mt-3 h-4 w-120 max-w-full rounded bg-zinc-200" />
      </div>

      {/* Main table container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-zinc-200" />
            <div className="h-3 w-40 rounded bg-zinc-100" />
          </div>

          <div className="h-11 w-full rounded-xl bg-zinc-100 sm:max-w-sm" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 border-collapse text-left">
            {/* Table header */}
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                {[32, 24, 36, 24, 24, 20, 16].map((width, index) => (
                  <th key={index} className="px-5 py-4">
                    <div
                      className="h-3 rounded bg-zinc-200"
                      style={{ width: `${width * 2}px` }}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table rows */}
            <tbody className="divide-y divide-zinc-100">
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row}>
                  {/* Name */}
                  <td className="px-5 py-5">
                    <div className="h-4 w-28 rounded bg-zinc-200" />
                  </td>

                  {/* Lead type */}
                  <td className="px-5 py-5">
                    <div className="h-6 w-24 rounded-full bg-zinc-200" />
                  </td>

                  {/* Email */}
                  <td className="px-5 py-5">
                    <div className="h-4 w-36 rounded bg-zinc-100" />
                  </td>

                  {/* Mobile */}
                  <td className="px-5 py-5">
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                  </td>

                  {/* Country */}
                  <td className="px-5 py-5">
                    <div className="h-4 w-20 rounded bg-zinc-100" />
                  </td>

                  {/* Submitted */}
                  <td className="px-5 py-5">
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                  </td>

                  {/* Details */}
                  <td className="px-5 py-5">
                    <div className="ml-auto size-8 rounded-lg bg-zinc-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
