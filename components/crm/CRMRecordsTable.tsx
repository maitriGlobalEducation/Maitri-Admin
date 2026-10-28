"use client";

import { Fragment, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp, Inbox } from "lucide-react";

export interface CRMRecord {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  values: { label: string; value: string }[];
  [key: string]: unknown;
}

export interface CRMColumn {
  key: string;
  label: string;
  render?: (record: CRMRecord) => React.ReactNode;
  className?: string;
}

interface CRMRecordsTableProps {
  title: string;
  description: string;
  records: CRMRecord[];
  columns: CRMColumn[];
  searchPlaceholder?: string;
}

export default function CRMRecordsTable({
  title,
  description,
  records,
  columns,
  searchPlaceholder = "Search records...",
}: CRMRecordsTableProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.title,
        record.subtitle,
        record.date,
        ...record.values.flatMap((item) => [item.label, item.value]),
        ...columns.map((column) => String(record[column.key] ?? "")),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [records, search, columns]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#f4511e]">
          Customer Relationship Management
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500 sm:text-base">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold text-zinc-900">All records</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-[#f4511e] focus:bg-white focus:ring-4 focus:ring-[#f4511e]/10"
            />
          </div>
        </div>

        {/* Actual table */}
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Inbox size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-zinc-900">
              {records.length === 0
                ? "No submissions yet"
                : "No matching records"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
              {records.length === 0
                ? "New submissions from the public website will appear here."
                : "Try another search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 ${column.className ?? ""}`}
                    >
                      {column.label}
                    </th>
                  ))}

                  <th
                    scope="col"
                    className="w-14 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.map((record) => {
                  const isExpanded = expandedId === record.id;

                  return (
                    <Fragment key={record.id}>
                      <tr
                        className={`transition-colors ${
                          isExpanded ? "bg-orange-50/30" : "hover:bg-zinc-50/70"
                        }`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-5 py-4 text-sm text-zinc-700 ${column.className ?? ""}`}
                          >
                            {column.render
                              ? column.render(record)
                              : String(record[column.key] ?? "—")}
                          </td>
                        ))}

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            aria-label={`${isExpanded ? "Hide" : "View"} details for ${record.title}`}
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpandedId(isExpanded ? null : record.id)
                            }
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#e94717]"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={columns.length + 1}
                            className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-5"
                          >
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-zinc-900">
                                Submission details
                              </h3>
                              <p className="mt-1 text-xs text-zinc-500">
                                Record ID: {record.id}
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {record.values.map((item, index) => (
                                <div
                                  key={`${item.label}-${index}`}
                                  className="min-w-0 rounded-xl border border-zinc-200/80 bg-white p-4"
                                >
                                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                    {item.label}
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-zinc-800">
                                    {item.value || "—"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
