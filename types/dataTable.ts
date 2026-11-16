import { ReactNode } from "react";

export interface DataTableToolbar {
  title?: ReactNode;
  description?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export interface DataTableActions<T> {
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

export interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
