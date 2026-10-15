import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Check,
  Copy,
  Mail,
  Phone,
  MapPin,
  Clock,
  Flag,
  X,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  UnusedSessionOpportunityItem,
  contactOpportunity,
} from "../../service/opportunities";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { DataTable } from "../shared";

interface UnusedSessionsOpportunitiesTabProps {
  data: UnusedSessionOpportunityItem[];
  isLoading: boolean;
  selectedLocation: string;
  statusFilter: "all" | "pending" | "contacted";
  onStatusFilterChange: (filter: "all" | "pending" | "contacted") => void;
}

const getInitials = (first?: string, last?: string) => {
  const f = (first || "").trim();
  const l = (last || "").trim();
  if (!f && !l) return "??";
  return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
};

const formatContactDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export const UnusedSessionsOpportunitiesTab: React.FC<UnusedSessionsOpportunitiesTabProps> = ({
  data,
  isLoading,
  selectedLocation,
  statusFilter,
  onStatusFilterChange,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const contactMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      setContactingId(id);
      return contactOpportunity({ id, type: "increase" });
    },
    onSuccess: () => {
      renderSuccessToast("Client contact recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["opportunities", "increase"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to log contact";
      renderErrorToast(msg);
    },
    onSettled: () => {
      setContactingId(null);
    },
  });

  // Filter logic
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

    // Contact filter
    if (statusFilter === "contacted") {
      result = result.filter((item) => item.contacted === true);
    } else if (statusFilter === "pending") {
      result = result.filter((item) => item.contacted !== true);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((item) => {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        const email = (item.email || "").toLowerCase();
        const userId = (item.user_id || "").toLowerCase();
        const phone = (item.cell_phone || item.home_phone || item.work_phone || "").toLowerCase();
        const location = (item.location || "").toLowerCase();
        const packageName = (item.package_name || "").toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          userId.includes(q) ||
          phone.includes(q) ||
          location.includes(q) ||
          packageName.includes(q)
        );
      });
    }

    return result;
  }, [data, selectedLocation, statusFilter, search]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Counts for status pills
  const statusCounts = useMemo(() => {
    const total = data.length;
    const contacted = data.filter((d) => d.contacted === true).length;
    const pending = total - contacted;
    return { total, pending, contacted };
  }, [data]);

  const columns = useMemo<ColumnDef<UnusedSessionOpportunityItem, any>[]>(() => [
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
        const phone = item.cell_phone || item.home_phone || item.work_phone;
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
      id: "package_name",
      header: "Package / Membership",
      cell: ({ row }) => {
        const item = row.original;
        const pkgName = item.package_name || "";
        const cleanName = pkgName.includes("-")
          ? pkgName.split("-").pop()?.trim() || pkgName
          : pkgName;
        return (
          <div className="space-y-0.5 max-w-[200px] py-1">
            <p className="text-xs font-bold text-dark-1 truncate" title={pkgName}>
              {cleanName || "Standard Membership"}
            </p>
            {pkgName && cleanName !== pkgName && (
              <p className="text-[10px] text-grey-5 truncate font-normal" title={pkgName}>
                {pkgName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "unused_credits",
      header: "Unused Credits",
      cell: ({ row }) => {
        const item = row.original;
        const unusedCount = Number(item.unused_credit) || 0;
        const pkgName = item.package_name || "";
        const match = pkgName.match(/\d+/);
        const maxMonthly = match ? Number(match[0]) : null;
        const isMismatch = maxMonthly !== null && unusedCount !== maxMonthly;

        return (
          <div className="flex items-center gap-2 py-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              {unusedCount} {unusedCount === 1 ? "credit" : "credits"}
            </span>

            {isMismatch && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-rose-600 cursor-pointer p-0.5 rounded hover:bg-rose-50 transition-colors">
                      <Flag className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-xs">
                    <p className="font-bold">Credit Mismatch Flag</p>
                    <p className="text-[11px] text-zinc-300">
                      Package monthly quota ({maxMonthly}) differs from unused credit count ({unusedCount}).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      id: "contact_status",
      header: "Outreach History",
      cell: ({ row }) => {
        const item = row.original;
        const isContacted = Boolean(item.contacted);
        const latestContacted = formatContactDate(item.latest_contacted_at);
        const firstContacted = formatContactDate(item.first_contacted_at);

        if (isContacted) {
          return (
            <div className="space-y-0.5 py-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-2.5 h-2.5 text-emerald-600" /> Contacted
              </span>
              {latestContacted && (
                <p className="text-[10px] text-grey-5 font-mono">
                  Last: {latestContacted}
                </p>
              )}
              {firstContacted && firstContacted !== latestContacted && (
                <p className="text-[10px] text-grey-5/70 font-mono">
                  First: {firstContacted}
                </p>
              )}
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-quaternary text-grey-5 border border-neutral-tertiary">
            Not Contacted
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const item = row.original;
        const isContactingThis = contactingId === item.id;
        const isContacted = Boolean(item.contacted);

        return (
          <button
            type="button"
            disabled={isContactingThis || contactMutation.isPending}
            onClick={() => contactMutation.mutate({ id: item.id })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs whitespace-nowrap ${
              isContacted
                ? "bg-neutral-quaternary hover:bg-neutral-tertiary text-dark-1 border border-neutral-tertiary active:scale-95"
                : "bg-primary-base hover:bg-primary-base/90 text-white active:scale-95"
            } disabled:opacity-50`}
            title={isContacted ? "Record follow-up outreach" : "Record client contact"}
          >
            {isContactingThis ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : isContacted ? (
              "Contact Again"
            ) : (
              "Mark Contacted"
            )}
          </button>
        );
      },
    },
  ], [copiedId, contactingId, contactMutation]);

  const handleResetFilters = () => {
    setSearch("");
    onStatusFilterChange("all");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
          <input
            type="text"
            placeholder="Search by client name, email, user ID, package, location..."
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

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => {
              onStatusFilterChange("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-dark-1 text-white shadow-2xs"
                : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
            }`}
          >
            All ({statusCounts.total})
          </button>

          <button
            type="button"
            onClick={() => {
              onStatusFilterChange("pending");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Outreach ({statusCounts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStatusFilterChange("contacted");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === "contacted"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Contacted ({statusCounts.contacted})</span>
          </button>
        </div>
      </div>

      {/* Standard FrontDesk DataTable */}
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        enableSorting={true}
        rowId={(row) => `unused-${row.id}`}
        emptyMessage={
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-quaternary text-grey-2 flex items-center justify-center border border-neutral-tertiary">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-dark-1">
                No Unused Session Opportunities Found
              </h4>
              <p className="text-xs text-grey-5 max-w-sm mt-0.5">
                There are no unused session opportunities matching your active filters.
              </p>
            </div>
            {(search || statusFilter !== "all" || selectedLocation) && (
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
