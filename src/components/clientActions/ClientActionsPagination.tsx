import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ClientActionsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number; // 0 indicates "All"
  pageSizeOptions?: { label: string; value: number }[];
  itemLabel?: string; // e.g. "clients", "time slots"
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
}

export const ClientActionsPagination: React.FC<ClientActionsPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  itemLabel = "clients",
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) return null;

  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const startItem =
    pageSize === 0 ? 1 : Math.min((validCurrentPage - 1) * pageSize + 1, totalItems);
  const endItem =
    pageSize === 0 ? totalItems : Math.min(validCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (validCurrentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages];
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left: Summary text */}
      <div className="text-xs font-semibold text-grey-5 flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
        <span>
          Showing{" "}
          <strong className="font-extrabold text-dark-1">{startItem}</strong>
          {pageSize !== 0 && totalItems > 1 && (
            <>
              {" "}to{" "}
              <strong className="font-extrabold text-dark-1">{endItem}</strong>
            </>
          )}{" "}
          of <strong className="font-extrabold text-dark-1">{totalItems}</strong> {itemLabel}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
        {/* Page Size selector */}
        {pageSizeOptions && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-grey-5">
            <span className="hidden md:inline font-bold">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-neutral-quaternary border border-neutral-tertiary rounded-xl px-2.5 py-1.5 text-xs font-bold text-dark-1 focus:outline-none focus:border-primary-base cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="px-3 py-1.5 rounded-xl border border-neutral-tertiary text-xs font-extrabold text-dark-1 bg-neutral-quaternary hover:bg-neutral-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 text-center text-xs font-bold text-grey-2"
                  >
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === validCurrentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? "bg-primary-base text-white shadow-2xs"
                      : "bg-neutral-quaternary text-dark-1 hover:bg-neutral-tertiary border border-neutral-tertiary/60"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="px-3 py-1.5 rounded-xl border border-neutral-tertiary text-xs font-extrabold text-dark-1 bg-neutral-quaternary hover:bg-neutral-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
