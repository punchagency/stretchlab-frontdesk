import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Check,
  Copy,
  Mail,
  Phone,
  MapPin,
  X,
  Shield,
} from "lucide-react";
import { HealthcareOpportunityItem } from "../../service/opportunities";
import { DataTable } from "../shared";

interface HealthcareOpportunitiesTabProps {
  data: HealthcareOpportunityItem[];
  isLoading: boolean;
  selectedLocation: string;
}

const getInitials = (first?: string, last?: string) => {
  const f = (first || "").trim();
  const l = (last || "").trim();
  if (!f && !l) return "??";
  return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
};

const formatDueDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const HealthcareOpportunitiesTab: React.FC<HealthcareOpportunitiesTabProps> = ({
  data,
  isLoading,
  selectedLocation,
}) => {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter logic: location & search
  const filteredData = useMemo(() => {
    let result = data;

    // Location filter
    if (selectedLocation) {
      result = result.filter((item) => {
        const itemLoc = (item.location || "").toLowerCase().trim();
        const selLoc = selectedLocation.toLowerCase().trim();
        return itemLoc.includes(selLoc) || selLoc.includes(itemLoc);
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((item) => {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        const email = (item.email || "").toLowerCase();
        const userId = (item.user_id || "").toLowerCase();
        const phone = (item.cell_phone || "").toLowerCase();
        const location = (item.location || "").toLowerCase();
        const soldBy = (item.sold_by || "").toLowerCase();
        const remark = (item.remark || "").toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          userId.includes(q) ||
          phone.includes(q) ||
          location.includes(q) ||
          soldBy.includes(q) ||
          remark.includes(q)
        );
      });
    }

    return result;
  }, [data, selectedLocation, search]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns = useMemo<ColumnDef<HealthcareOpportunityItem, any>[]>(() => [
    {
      id: "client",
      header: "Client Name",
      cell: ({ row }) => {
        const item = row.original;
        const initials = getInitials(item.first_name, item.last_name);
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown Client";
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-base/10 text-primary-base font-black text-[11px] flex items-center justify-center shrink-0 border border-primary-base/20">
              {initials}
            </div>
            <div>
              <p className="font-extrabold text-dark-1 text-xs">
                {fullName}
              </p>
              {item.user_id && (
                <button
                  type="button"
                  onClick={(e) => handleCopyId(String(item.user_id), e)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-grey-5 hover:text-dark-1 px-1.5 py-0.5 rounded bg-neutral-quaternary border border-neutral-tertiary cursor-pointer transition-colors mt-0.5"
                  title="Copy ClubReady User ID"
                >
                  <span>#{item.user_id}</span>
                  {copiedId === String(item.user_id) ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-grey-5 opacity-70" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const item = row.original;
        const phone = item.cell_phone;
        return (
          <div className="space-y-1 py-1">
            {item.email ? (
              <a
                href={`mailto:${item.email}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-dark-1 hover:text-primary-base transition-colors truncate max-w-[200px]"
                title={item.email}
              >
                <Mail className="w-3 h-3 text-grey-2 shrink-0" />
                <span className="truncate">{item.email}</span>
              </a>
            ) : (
              <span className="text-[11px] text-grey-2 italic">No email</span>
            )}
            {phone && (
              <div>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-grey-5 hover:text-primary-base transition-colors"
                  title={phone}
                >
                  <Phone className="w-3 h-3 text-grey-2 shrink-0" />
                  <span>{phone}</span>
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Studio Location",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-dark-1 bg-neutral-quaternary px-2.5 py-1 rounded-lg border border-neutral-tertiary">
            <MapPin className="w-3.5 h-3.5 text-grey-2 shrink-0" />
            <span className="truncate max-w-[170px]">{item.location || "—"}</span>
          </span>
        );
      },
    },
    {
      id: "due_date",
      header: "Due Date",
      cell: ({ row }) => {
        const formattedDate = formatDueDate(row.original.due_date);
        return (
          <span className="text-xs font-bold text-dark-1 font-mono py-1 inline-block">
            {formattedDate}
          </span>
        );
      },
    },
    {
      id: "sold_by",
      header: "Sold By",
      cell: ({ row }) => {
        const soldBy = row.original.sold_by;
        return (
          <span className="text-xs font-semibold text-dark-1 py-1 inline-block truncate max-w-[150px]">
            {soldBy || "—"}
          </span>
        );
      },
    },
    {
      id: "remark",
      header: "Remark",
      cell: ({ row }) => {
        const remark = row.original.remark;
        return (
          <span
            className="text-xs font-normal text-grey-5 py-1 inline-block truncate max-w-[200px]"
            title={remark || undefined}
          >
            {remark || "—"}
          </span>
        );
      },
    },
  ], [copiedId]);

  const handleResetFilters = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Search Input Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
          <input
            type="text"
            placeholder="Search by client name, email, user ID, location, sold by..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-grey-5">
          Showing <span className="text-dark-1 font-extrabold">{filteredData.length}</span> records
        </div>
      </div>

      {/* Standard FrontDesk DataTable */}
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        enableSorting={true}
        rowId={(row) => `healthcare-${row.id}`}
        emptyMessage={
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-quaternary text-grey-2 flex items-center justify-center border border-neutral-tertiary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-dark-1">
                No Healthcare Opportunities Found
              </h4>
              <p className="text-xs text-grey-5 max-w-sm mt-0.5">
                There are no healthcare client records matching your active filters.
              </p>
            </div>
            {(search || selectedLocation) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-primary-base text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs hover:bg-primary-base/90"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
        pagination={{
          pageIndex: page - 1,
          pageSize: pageSize,
          pageCount: totalPages,
          totalCount: filteredData.length,
          onPaginationChange: (state) => {
            setPage(state.pageIndex + 1);
          },
        }}
      />
    </div>
  );
};
