"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Inbox,
  UserRound,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  FileText,
  CalendarIcon,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadAssignmentControl from "@/components/crm/LeadAssignmentControl";

export interface CRMRecord {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  values: { label: string; value: string }[];
  [key: string]: unknown;
  assignedTo?: string | null;
  assignedToName?: string | null;
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
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filters: {
    q: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  canAssignLeads?: boolean;
}

const leadTypeStyles: Record<string, string> = {
  contact: "bg-blue-50 text-blue-700 ring-blue-600/15",
  scholarship: "bg-violet-50 text-violet-700 ring-violet-600/15",
  event: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
};

const getLeadType = (record: CRMRecord) =>
  String(record.type ?? "").toLowerCase();

const getLeadTypeStyle = (record: CRMRecord) =>
  leadTypeStyles[getLeadType(record)] ??
  "bg-zinc-100 text-zinc-700 ring-zinc-600/15";

const getLeadTypeLabel = (record: CRMRecord) => {
  const labels: Record<string, string> = {
    contact: "Contact",
    scholarship: "Scholarship",
    event: "Event",
  };

  return labels[getLeadType(record)] ?? "Lead";
};

const parseDate = (value: string) => {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
};

const formatDateParam = (date?: Date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: string) => {
  const date = parseDate(value);

  if (!date) return "Select date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function CRMRecordsTable({
  title,
  description,
  records,
  columns,
  searchPlaceholder = "Search records...",
  totalRecords,
  currentPage,
  totalPages,
  pageSize,
  filters,
  canAssignLeads = false,
}: CRMRecordsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.q);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  // Debounced server-side search
  useEffect(() => {
    if (search === filters.q) return;

    const timeout = setTimeout(() => {
      updateQuery({ q: search.trim() });
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Any filter change starts from the first page.
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    });
  };

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    });
  };

  const clearFilters = () => {
    setSearch("");

    const params = new URLSearchParams();

    if (pageSize !== 10) {
      params.set("pageSize", String(pageSize));
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    });
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.type ||
    filters.status ||
    filters.startDate ||
    filters.endDate,
  );

  const visiblePages = Array.from(
    new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const firstRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastRecord = Math.min(currentPage * pageSize, totalRecords);

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <section className="space-y-7">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold text-amber-700">
          Customer Relationship Management
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500 sm:text-base">
          {description}
        </p>
      </div>

      {/* Main container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="space-y-5 border-b border-zinc-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-zinc-900">All records</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Showing{" "}
                <span className="font-semibold text-zinc-800">
                  {firstRecord}-{lastRecord}
                </span>{" "}
                of {totalRecords} records
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
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <SlidersHorizontal size={14} />
              Filters
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {/* Lead type */}
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  updateQuery({ type: value === "all" ? "" : (value ?? "") })
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-zinc-200 bg-white text-sm shadow-none focus:ring-amber-100">
                  <SelectValue placeholder="All lead types" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All lead types</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>

              {/* Status */}
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  updateQuery({ status: value === "all" ? "" : (value ?? "") })
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-zinc-200 bg-white text-sm shadow-none focus:ring-amber-100">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              {/* Start date */}
              <Popover>
                <PopoverTrigger className="flex h-10 w-full cursor-pointer items-center justify-start gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-600 shadow-none transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800">
                  <CalendarIcon size={15} className="text-amber-700" />

                  <span className="truncate">
                    {filters.startDate
                      ? formatDateLabel(filters.startDate)
                      : "Start date"}
                  </span>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDate(filters.startDate)}
                    onSelect={(date) =>
                      updateQuery({
                        startDate: formatDateParam(date),
                      })
                    }
                    disabled={(date) =>
                      Boolean(
                        filters.endDate && date > parseDate(filters.endDate)!,
                      )
                    }
                  />
                  {filters.startDate && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-amber-700 hover:bg-amber-50"
                        onClick={() => updateQuery({ startDate: "" })}
                      >
                        Clear start date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* End date */}
              <Popover>
                <PopoverTrigger className="flex h-10 w-full cursor-pointer items-center justify-start gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-600 shadow-none transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800">
                  <CalendarIcon size={15} className="text-amber-700" />

                  <span className="truncate">
                    {filters.endDate
                      ? formatDateLabel(filters.endDate)
                      : "End date"}
                  </span>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDate(filters.endDate)}
                    onSelect={(date) =>
                      updateQuery({
                        endDate: formatDateParam(date),
                      })
                    }
                    disabled={(date) =>
                      Boolean(
                        filters.startDate &&
                        date < parseDate(filters.startDate)!,
                      )
                    }
                  />
                  {filters.endDate && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-amber-700 hover:bg-amber-50"
                        onClick={() => updateQuery({ endDate: "" })}
                      >
                        Clear end date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Page size */}
              <Select
                value={String(pageSize)}
                onValueChange={(value) =>
                  updateQuery({ pageSize: value ?? "10" })
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-zinc-200 bg-white text-sm shadow-none focus:ring-amber-100">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-amber-700 transition hover:text-amber-900"
                >
                  <RotateCcw size={13} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {records.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Inbox size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-zinc-900">
              {totalRecords === 0 ? "No matching leads" : "No submissions yet"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
              {totalRecords === 0
                ? "Try changing your search or filters."
                : "New submissions from the public website will appear here."}
            </p>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="mt-4 cursor-pointer border-amber-200 text-amber-800 hover:bg-amber-50"
              >
                Clear filters
              </Button>
            )}
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
                      className={`whitespace-nowrap px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 ${column.className ?? ""}`}
                    >
                      {column.label}
                    </th>
                  ))}

                  <th className="w-16 px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {records.map((record) => {
                  const isExpanded = expandedId === record.id;

                  return (
                    <Fragment key={record.id}>
                      <tr
                        onClick={() => toggleExpanded(record.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? "bg-amber-50/50" : "hover:bg-zinc-50/80"
                        } ${isPending ? "opacity-60" : ""}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-5 py-4 text-sm text-zinc-700 ${column.className ?? ""}`}
                          >
                            {column.key === "type" ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getLeadTypeStyle(record)}`}
                              >
                                {getLeadTypeLabel(record)}
                              </span>
                            ) : column.render ? (
                              column.render(record)
                            ) : (
                              String(record[column.key] ?? "—")
                            )}
                          </td>
                        ))}

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            aria-label={`${isExpanded ? "Hide" : "View"} details for ${record.title}`}
                            aria-expanded={isExpanded}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(record.id);
                            }}
                            className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition ${
                              isExpanded
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-zinc-200 bg-white text-zinc-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            }`}
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
                            className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-6"
                          >
                            <div className="space-y-5">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-zinc-900">
                                      {record.title}
                                    </h3>

                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getLeadTypeStyle(record)}`}
                                    >
                                      {getLeadTypeLabel(record)} Lead
                                    </span>
                                  </div>

                                  <p className="mt-1 text-xs text-zinc-500">
                                    Submission ID: {record.id}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <CalendarDays size={14} />
                                  {record.date}
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {record.values.map((item, index) => {
                                  const label = item.label.toLowerCase();

                                  const Icon = label.includes("email")
                                    ? Mail
                                    : label.includes("mobile") ||
                                        label.includes("phone")
                                      ? Phone
                                      : label.includes("country")
                                        ? MapPin
                                        : label.includes("name")
                                          ? UserRound
                                          : FileText;

                                  return (
                                    <div
                                      key={`${item.label}-${index}`}
                                      className="min-w-0 rounded-xl border border-zinc-200/80 bg-white p-4 transition hover:border-amber-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon
                                          size={14}
                                          className="shrink-0 text-amber-700"
                                        />

                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                                          {item.label}
                                        </p>
                                      </div>

                                      <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-zinc-800">
                                        {item.value || "—"}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>

                              {canAssignLeads && (
                                <LeadAssignmentControl
                                  leadId={record.id}
                                  assignedTo={record.assignedTo ?? null}
                                  assignedToName={record.assignedToName ?? null}
                                />
                              )}
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

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="flex flex-col gap-4 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Showing{" "}
              <span className="font-semibold text-zinc-800">
                {firstRecord}-{lastRecord}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-zinc-800">
                {totalRecords}
              </span>{" "}
              leads
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1 || isPending}
                onClick={() => changePage(currentPage - 1)}
                className="h-9 cursor-pointer rounded-lg border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {visiblePages.map((page, index) => (
                  <Fragment key={page}>
                    {index > 0 && visiblePages[index - 1] !== page - 1 && (
                      <span className="px-1 text-zinc-400">...</span>
                    )}

                    <button
                      type="button"
                      onClick={() => changePage(page)}
                      disabled={isPending || currentPage === page}
                      className={`size-9 cursor-pointer rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-zinc-600 hover:bg-amber-50 hover:text-amber-800"
                      } disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  </Fragment>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages || isPending}
                onClick={() => changePage(currentPage + 1)}
                className="h-9 cursor-pointer rounded-lg border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
