export default function Loading() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E9E5DC] bg-white shadow-[0_2px_12px_rgba(23,44,61,0.04)] animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#EEEAE1] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-[#EDEAE2]" />
          <div className="h-3 w-36 rounded-md bg-[#F2F0EA]" />
        </div>

        <div className="h-9 w-full rounded-xl bg-[#F2F0EA] sm:max-w-65" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 text-left">
          <thead className="bg-[#FAF9F5]">
            <tr>
              {["Username", "Role", "Status", "Created", "Actions"].map(
                (heading) => (
                  <th key={heading} className="px-5 py-3">
                    <div className="h-2.5 w-16 rounded bg-[#E9E5DC]" />
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EDE6]">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {/* Username */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 shrink-0 rounded-xl bg-[#F0EBDD]" />
                    <div className="h-3 w-24 rounded bg-[#EDEAE2]" />
                  </div>
                </td>

                {/* Role */}
                <td className="px-5 py-3">
                  <div className="h-6 w-16 rounded-md bg-[#F0EBDD]" />
                </td>

                {/* Status */}
                <td className="px-5 py-3">
                  <div className="h-3 w-14 rounded bg-[#EDEAE2]" />
                </td>

                {/* Created */}
                <td className="px-5 py-3">
                  <div className="h-3 w-20 rounded bg-[#EDEAE2]" />
                </td>

                {/* Actions */}
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <div className="size-8 rounded-lg bg-[#F0EBDD]" />
                    <div className="h-8 w-20 rounded-lg bg-[#F0EBDD]" />
                    <div className="size-8 rounded-lg bg-[#F0EBDD]" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
