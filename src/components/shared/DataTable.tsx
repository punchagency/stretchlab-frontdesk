import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { ContainLoader } from "./ContainLoader";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: string | ((row: TData) => string);
  rowId?: (row: TData) => string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPaginationChange: (state: PaginationState) => void;
    totalCount?: number;
  };
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  enableSorting?: boolean;
  emptyMessage?: React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  rowClassName,
  rowId,
  pagination,
  enableSearch = false,
  searchPlaceholder,
  searchKeys,
  enableSorting = true,
  emptyMessage,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const paginationState = pagination
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
    : undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    pageCount: pagination?.pageCount,
    manualPagination: true,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: any) => {
      const val = String(filterValue || "").toLowerCase().trim();
      if (!val) return true;
      const original = row.original as any;
      if (!original) return false;

      const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((acc, part) => {
          return acc && acc[part] !== undefined ? acc[part] : undefined;
        }, obj);
      };

      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const cellValue = getNestedValue(original, key);
          if (cellValue === null || cellValue === undefined) return false;
          return String(cellValue).toLowerCase().includes(val);
        });
      }

      const searchObj = (obj: any): boolean => {
        if (obj === null || obj === undefined) return false;
        if (
          typeof obj === "string" ||
          typeof obj === "number" ||
          typeof obj === "boolean"
        ) {
          return String(obj).toLowerCase().includes(val);
        }
        if (Array.isArray(obj)) {
          return obj.some((item) => searchObj(item));
        }
        if (typeof obj === "object") {
          return Object.values(obj).some((v) => searchObj(v));
        }
        return false;
      };

      return searchObj(original);
    },
    onPaginationChange: pagination
      ? (updater) => {
        if (typeof updater === "function") {
          const current = {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          };
          const next = updater(current);
          pagination.onPaginationChange(next);
        } else {
          pagination.onPaginationChange(updater);
        }
      }
      : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    state: {
      ...(paginationState ? { pagination: paginationState } : {}),
      globalFilter,
      sorting,
    },
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
  });

  if (isLoading) {
    return <ContainLoader text="Loading records..." className="py-16" />;
  }

  return (
    <div className="w-full overflow-x-auto text-xs">
      {enableSearch && (
        <div className="p-4 border-b border-neutral-tertiary bg-white">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-2" />
            <input
              type="text"
              placeholder={searchPlaceholder || "Search table..."}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:ring-2 focus:ring-primary-base/20 focus:border-primary-base transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="bg-neutral-quaternary border-b border-neutral-tertiary text-grey-5 font-bold uppercase tracking-wider"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.column.columnDef.size }}
                  className="px-6 py-4"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={`flex items-center gap-1.5 ${enableSorting && header.column.getCanSort()
                          ? "cursor-pointer select-none hover:text-dark-1 transition-colors"
                          : ""
                        }`}
                      onClick={
                        enableSorting && header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {enableSorting && header.column.getCanSort() && (
                        <span className="shrink-0 text-grey-2">
                          {{
                            asc: (
                              <ArrowUp className="w-3.5 h-3.5 text-primary-base" />
                            ),
                            desc: (
                              <ArrowDown className="w-3.5 h-3.5 text-primary-base" />
                            ),
                          }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
                            )}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-neutral-tertiary font-semibold text-grey-5">
          {table.getRowModel().rows.map((row) => {
            const calculatedRowClass =
              typeof rowClassName === "function"
                ? rowClassName(row.original)
                : rowClassName || "";

            return (
              <tr
                key={row.id}
                id={rowId ? rowId(row.original) : undefined}
                onClick={() => onRowClick && onRowClick(row.original)}
                className={`hover:bg-neutral-quaternary/40 transition-colors ${onRowClick ? "cursor-pointer" : ""
                  } ${calculatedRowClass}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.columnDef.size }}
                    className="px-6 py-4"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-grey-2 font-semibold"
              >
                {emptyMessage || "No records found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {pagination &&
        (pagination.pageCount > 1 ||
          (pagination.totalCount !== undefined &&
            pagination.totalCount > 0)) && (
          <div className="px-6 py-4 bg-neutral-quaternary/40 border-t border-neutral-tertiary flex justify-between items-center text-xs">
            <span className="text-grey-5 font-semibold">
              Page{" "}
              <strong className="font-extrabold text-dark-1">
                {pagination.pageIndex + 1}
              </strong>{" "}
              of{" "}
              <strong className="font-extrabold text-dark-1">
                {pagination.pageCount || 1}
              </strong>
              {pagination.totalCount !== undefined && (
                <span className="ml-2 font-normal text-grey-2">
                  (Showing{" "}
                  <strong className="font-extrabold text-grey-5">
                    {table.getRowModel().rows.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-extrabold text-grey-5">
                    {pagination.totalCount}
                  </strong>{" "}
                  records)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3.5 py-1.5 border border-neutral-tertiary bg-white hover:bg-neutral-quaternary disabled:opacity-50 text-grey-5 font-bold rounded-lg cursor-pointer transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3.5 py-1.5 border border-neutral-tertiary bg-white hover:bg-neutral-quaternary disabled:opacity-50 text-grey-5 font-bold rounded-lg cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
