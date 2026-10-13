import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  MapPin,
  Calendar,
  Send,
  RefreshCw,
  X,
  ChevronDown,
} from "lucide-react";
import {
  getFrontdeskHome,
  IntakeSubmission,
  StudioLocation,
} from "../service/home";
import { DataTable } from "../components/shared";
import { SendIntakePeopleModal } from "../components/intake/SendIntakePeopleModal";

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const localDay = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getIsoDateStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return localDay(d);
};

export const ClientIntakesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

  // Email Modal State
  const [emailSub, setEmailSub] = useState<IntakeSubmission | null>(null);

  const todayStr = getIsoDateStr(0);
  const tomorrowStr = getIsoDateStr(1);
  const isTodaySelected = startDate === todayStr && endDate === todayStr && !showCustomDatePicker;
  const isTomorrowSelected = startDate === tomorrowStr && endDate === tomorrowStr && !showCustomDatePicker;
  const isCustomDateSelected = Boolean(
    showCustomDatePicker || ((startDate || endDate) && !isTodaySelected && !isTomorrowSelected)
  );

  const homeQueryParams = {
    page,
    page_size: pageSize,
    location_id: selectedLocation || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  const {
    data: homeResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["frontdesk-client-intakes", homeQueryParams],
    queryFn: async () => {
      const response = await getFrontdeskHome(homeQueryParams);
      return response.data?.data;
    },
    staleTime: 60 * 1000,
  });

  const locations: StudioLocation[] = homeResponse?.locations || [];
  const submissions: IntakeSubmission[] = homeResponse?.submissions || [];
  const submissionsTotal = homeResponse?.summary?.submissions_total || submissions.length;
  const totalPages = homeResponse?.pagination?.total_pages || Math.ceil(submissionsTotal / pageSize) || 1;

  // Filter submissions by search query
  const filteredSubmissions = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase().trim();
    return submissions.filter((sub) => {
      const client = (sub.client_name || "").toLowerCase();
      const subId = String(sub.id);
      const submitterId = String(sub.submitter_id || "");
      const formId = String(sub.form_id || "");
      const loc = (sub.location_name || "").toLowerCase();
      return (
        client.includes(q) ||
        subId.includes(q) ||
        submitterId.includes(q) ||
        formId.includes(q) ||
        loc.includes(q)
      );
    });
  }, [submissions, search]);

  const handleResetFilters = () => {
    setSelectedLocation("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setShowCustomDatePicker(false);
    setPage(1);
  };

  const columns = [
    {
      header: "Submitter Name",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-base/10 text-primary-base font-black text-[11px] flex items-center justify-center shrink-0 border border-primary-base/20">
              {getInitials(sub.client_name)}
            </div>
            <div>
              <p className="font-extrabold text-dark-1 text-xs">
                {sub.client_name || "Unknown Client"}
              </p>
              <p className="text-[10px] text-grey-2 font-mono">
                Submitter ID #{sub.submitter_id || sub.id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Studio Location",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-dark-1 bg-neutral-quaternary px-2.5 py-1 rounded-lg border border-neutral-tertiary">
            <MapPin className="w-4 h-4 text-grey-2 shrink-0" />
            <span>{sub.location_name || `Location #${sub.location_id}`}</span>
          </span>
        );
      },
    },
    {
      header: "Submitted At",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <span className="text-grey-5 font-mono text-[11px]">
            {formatDate(sub.submitted_at)}
          </span>
        );
      },
    },
    {
      header: "Form ID",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <span className="text-grey-2 font-mono text-[11px]">
            Form #{sub.form_id}
          </span>
        );
      },
    },
    {
      header: "Action",
      size: 140,
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <button
            type="button"
            onClick={() => setEmailSub(sub)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold rounded-xl text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Send intake form & AI summary"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card matching Home.tsx / First Visits structure */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20">
                FrontDesk Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
              Client Intakes
            </h1>
            <p className="text-grey-5 text-xs sm:text-sm mt-1 font-medium">
              Email client intake form submissions and AI summaries to team members, trainers, or studio mailboxes
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-extrabold rounded-xl text-xs border border-neutral-tertiary transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin text-primary-base" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-6">
        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
            <input
              type="text"
              placeholder="Search submitter name, location, form ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location & Date Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-grey-2 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map((loc: any) => {
                  const locId = typeof loc === "object" ? loc?.location_id : loc;
                  const locName = typeof loc === "object" ? loc?.location_name : loc;
                  return (
                    <option key={locId} value={locId}>
                      {locName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date Filters: Today, Tomorrow, Custom */}
            <div className="flex items-center gap-1 p-1 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (isTodaySelected) {
                    setStartDate("");
                    setEndDate("");
                  } else {
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                  }
                  setShowCustomDatePicker(false);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  isTodaySelected
                    ? "bg-primary-base text-white shadow-2xs"
                    : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isTomorrowSelected) {
                    setStartDate("");
                    setEndDate("");
                  } else {
                    setStartDate(tomorrowStr);
                    setEndDate(tomorrowStr);
                  }
                  setShowCustomDatePicker(false);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  isTomorrowSelected
                    ? "bg-primary-base text-white shadow-2xs"
                    : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomDatePicker((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCustomDateSelected
                    ? "bg-primary-base text-white shadow-2xs"
                    : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                }`}
                title="Select custom date range"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Custom</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showCustomDatePicker ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Picker Inputs Drawer */}
        {showCustomDatePicker && (
          <div className="p-4 bg-neutral-quaternary/30 border border-neutral-tertiary rounded-2xl flex flex-wrap items-center gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-grey-5 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-neutral-tertiary rounded-xl px-3 py-1.5 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-grey-5 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-neutral-tertiary rounded-xl px-3 py-1.5 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear custom dates
              </button>
            )}
          </div>
        )}

        {/* Submissions Table with First Visits style & pagination */}
        <DataTable
          columns={columns}
          data={filteredSubmissions}
          isLoading={isLoading}
          enableSorting={true}
          rowId={(row: IntakeSubmission) => `submission-row-${row.id}`}
          emptyMessage={
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-quaternary text-grey-2 flex items-center justify-center border border-neutral-tertiary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-dark-1">No Intake Submissions Found</h4>
                <p className="text-xs text-grey-5 max-w-sm mt-0.5">
                  There are no intake form submissions matching your active filters.
                </p>
              </div>
              {(selectedLocation || startDate || endDate || search) && (
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
            totalCount: search ? filteredSubmissions.length : submissionsTotal,
            onPaginationChange: (state) => {
              setPage(state.pageIndex + 1);
            },
          }}
        />
      </div>

      {/* Send Intake Email Modal */}
      <SendIntakePeopleModal
        isOpen={Boolean(emailSub)}
        submissionId={emailSub?.id || null}
        clientName={emailSub?.client_name}
        locationName={emailSub?.location_name}
        onClose={() => setEmailSub(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
