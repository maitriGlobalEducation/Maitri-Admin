import { Pencil, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { ReactNode, Key } from "react";

interface DataTableToolbar {
  title?: ReactNode;
  description?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface DataTableActions<T> {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  editTitle?: string;
  deleteTitle?: string;
  customActions?: (row: T) => ReactNode;
}

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => Key;

  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;

  pagination?: DataTablePagination;
  toolbar?: DataTableToolbar;

  actions?: DataTableActions<T>;

  minWidth?: string;
  rowClassName?: string;
}

export default function DataTable<T>({
  actions,
  columns,
  data,
  getRowKey,
  loading = false,
  emptyState,
  pagination,
  toolbar,
  minWidth = "700px",
  rowClassName = "transition hover:bg-zinc-50",
}: DataTableProps<T>) {
  const getVisiblePages = () => {
    if (!pagination) return [];

    const { currentPage, totalPages } = pagination;

    const pages = new Set<number>([
      1,
      totalPages,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);

    return [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        {toolbar && (
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {toolbar.title && (
                <h2 className="font-semibold text-zinc-900">{toolbar.title}</h2>
              )}

              {toolbar.description && (
                <p className="mt-1 text-xs text-zinc-500">
                  {toolbar.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {toolbar.onSearchChange && (
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    type="text"
                    value={toolbar.searchValue ?? ""}
                    onChange={(event) =>
                      toolbar.onSearchChange?.(event.target.value)
                    }
                    placeholder={toolbar.searchPlaceholder ?? "Search..."}
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-64"
                  />

                  {toolbar.searchValue && (
                    <button
                      type="button"
                      onClick={() => toolbar.onSearchChange?.("")}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-700"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              )}

              {toolbar.onRefresh && (
                <button
                  type="button"
                  disabled={toolbar.refreshing}
                  onClick={toolbar.onRefresh}
                  aria-label="Refresh table"
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-4 ${
                      toolbar.refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>
        )}
        <table className="w-full text-left" style={{ minWidth }}>
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${
                    column.headerClassName ?? ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-xs">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} aria-hidden="true">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 ${column.cellClassName ?? ""}`}
                    >
                      <div className="animate-pulse">
                        <div
                          className={`h-3.5 rounded bg-zinc-200 ${
                            columnIndex === 0
                              ? "w-3/4"
                              : columnIndex % 2 === 0
                                ? "w-1/2"
                                : "w-2/3"
                          }`}
                        />
                      </div>
                    </td>
                  ))}

                  {actions && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <div className="size-8 animate-pulse rounded-md bg-zinc-200" />
                        <div className="size-8 animate-pulse rounded-md bg-zinc-200" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-10 text-center"
                >
                  {emptyState ?? (
                    <p className="text-sm text-zinc-500">No records found.</p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={getRowKey(row)} className={rowClassName}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-row-enter px-5 py-4 ${column.cellClassName ?? ""}`}
                      style={{
                        animationDelay: `${index * 35}ms`,
                      }}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}

                  {actions && (
                    <td className="table-row-enter whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {actions.onEdit && (
                          <button
                            type="button"
                            onClick={() => actions.onEdit?.(row)}
                            title={actions.editTitle ?? "Edit"}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-sky-600 transition hover:bg-sky-100"
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {actions.onDelete && (
                          <button
                            type="button"
                            onClick={() => actions.onDelete?.(row)}
                            title={actions.deleteTitle ?? "Delete"}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-red-500 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {actions.customActions?.(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3">
          <button
            type="button"
            disabled={pagination.currentPage === 1 || loading}
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {visiblePages.map((page, index) => (
                <span key={page} className="flex items-center gap-1">
                  {index > 0 && visiblePages[index - 1] !== page - 1 && (
                    <span className="px-1 text-zinc-400">...</span>
                  )}

                  <button
                    type="button"
                    onClick={() => pagination.onPageChange(page)}
                    disabled={loading || pagination.currentPage === page}
                    className={`size-9 rounded-lg text-sm font-medium transition cursor-pointer ${
                      pagination.currentPage === page
                        ? "bg-orange-600 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    } disabled:cursor-not-allowed`}
                  >
                    {page}
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={
              pagination.currentPage === pagination.totalPages || loading
            }
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
