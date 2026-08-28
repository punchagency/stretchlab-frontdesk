import { useState } from "react";
import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getFrontdeskHome,
  IntakeSubmission,
} from "../service/home";
import { getUserCookie } from "../utils/user";
import {
  FileText,
  MapPin,
  Calendar,
  Search,
  RotateCcw,
  User,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ContainLoader, DataTable, ErrorHandle } from "../components/shared";

export const Home = () => {
  const token = getUserCookie();

  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [selectedSubmission, setSelectedSubmission] =
    useState<IntakeSubmission | null>(null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const homeQueryParams = {
    page,
    page_size: pageSize,
    location_id: selectedLocation || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  const {
    data: homeData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["frontdesk-home", homeQueryParams],
    queryFn: async () => {
      const response = await getFrontdeskHome(homeQueryParams);
      return response.data?.data;
    },
  });


  const submissions = homeData?.submissions || [];
  const locations = homeData?.locations || [];
  const totalSubmissions = homeData?.pagination?.total || 0;
  const totalPages = homeData?.pagination?.total_pages || 1;

  const handleResetFilters = () => {
    setSelectedLocation("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      (sub.client_name || "").toLowerCase().includes(query) ||
      (sub.location_name || "").toLowerCase().includes(query) ||
      String(sub.form_id).includes(query) ||
      String(sub.id).includes(query)
    );
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const columns = [
    {
      header: "Client Name",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-base/10 text-primary-base font-bold flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-dark-1 text-xs">
                {sub.client_name || "Unknown Client"}
              </p>
              <p className="text-[10px] text-grey-2 font-mono">
                Submission #{sub.id}
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
            <MapPin className="w-3 h-3 text-grey-2" />
            {sub.location_name || `Location #${sub.location_id}`}
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
      header: "Task Status",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <span
            className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${sub.task_status === "completed"
              ? "bg-green-50 text-green-600 border-green-200"
              : sub.task_status === "pending"
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-neutral-quaternary text-grey-5 border-neutral-tertiary"
              }`}
          >
            {sub.task_status || "SUBMITTED"}
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
      header: "Actions",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <button
            onClick={() => setSelectedSubmission(sub)}
            className="px-3 py-1.5 bg-primary-base/10 text-primary-base hover:bg-primary-base/20 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            View Details
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20">
              Studio Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
            Intake Submissions
          </h1>
          <p className="text-grey-5 text-xs sm:text-sm mt-1">
            Live overview of client intake form submissions taken at your studio locations.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 font-bold rounded-xl text-xs transition-all cursor-pointer border border-neutral-tertiary active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw
            className={`w-4 h-4 ${isRefetching ? "animate-spin text-primary-base" : ""}`}
          />
          {isRefetching ? "Refreshing..." : "Refresh Feed"}
        </button>
      </div>

      {/* Metrics Rollup Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2  gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
              Total Submissions
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-1">
              {totalSubmissions}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
              Active Studios
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-1">
              {locations.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-tertiary shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-2" />
            <input
              type="text"
              placeholder="Search by client name, location, or form ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:ring-2 focus:ring-primary-base/20 focus:border-primary-base transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center gap-1.5 bg-neutral-quaternary/40 border border-neutral-tertiary px-3 py-1.5 rounded-xl text-xs">
              <MapPin className="w-3.5 h-3.5 text-grey-2 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-bold text-dark-1 focus:outline-none cursor-pointer text-xs pr-2"
              >
                <option value="">All Locations ({locations.length})</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-quaternary/40 border border-neutral-tertiary px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-grey-2 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent font-bold text-dark-1 focus:outline-none cursor-pointer text-xs"
                />
              </div>
              <span className="text-grey-2 font-bold text-xs">to</span>
              <div className="flex items-center gap-1.5 bg-neutral-quaternary/40 border border-neutral-tertiary px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-grey-2 shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent font-bold text-dark-1 focus:outline-none cursor-pointer text-xs"
                />
              </div>
            </div>

            {/* Reset Filters */}
            {(selectedLocation || startDate || endDate || search) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-primary-base hover:underline flex items-center gap-1 cursor-pointer px-2 py-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submissions Table Container */}
      <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-xs overflow-hidden">
        {isLoading ? (
          <ContainLoader text="Loading studio intake submissions..." className="py-20" />
        ) : isError ? (
          <ErrorHandle
            message={(error as any)?.response?.data?.message || "Failed to load studio intake submissions."}
            retry={() => refetch()}
            className="py-20 border-none shadow-none"
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredSubmissions}
            isLoading={isLoading}
            enableSorting={true}
            pagination={{
              pageIndex: page - 1,
              pageSize: pageSize,
              pageCount: totalPages,
              totalCount: totalSubmissions,
              onPaginationChange: (state) => {
                setPage(state.pageIndex + 1);
              },
            }}
          />
        )}
      </div>

      {/* Full-Screen View Submission Detail Modal Drawer Overlay */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-2xl w-full max-w-lg overflow-hidden space-y-4 my-auto relative z-[101]">
            <div className="p-6 border-b border-neutral-tertiary flex justify-between items-center bg-neutral-quaternary/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-base text-white flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-dark-1 text-base">
                    Intake Submission Details
                  </h3>
                  <p className="text-xs text-grey-5 font-mono">
                    ID #{selectedSubmission.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold text-grey-5">
              <div className="p-4 bg-primary-base/5 border border-primary-base/20 rounded-2xl space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-primary-base">
                  Client Name
                </p>
                <p className="text-lg font-black text-dark-1">
                  {selectedSubmission.client_name || "Unknown Client"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-0.5">
                  <span className="text-[10px] text-grey-2 font-bold uppercase block">
                    Studio Location
                  </span>
                  <span className="font-bold text-dark-1 text-xs">
                    {selectedSubmission.location_name || `Location #${selectedSubmission.location_id}`}
                  </span>
                </div>

                <div className="p-3 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-0.5">
                  <span className="text-[10px] text-grey-2 font-bold uppercase block">
                    Task Status
                  </span>
                  <span className="font-bold text-green-600 text-xs uppercase">
                    {selectedSubmission.task_status || "SUBMITTED"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-tertiary">
                <div className="flex justify-between py-1 border-b border-neutral-tertiary/40">
                  <span>Form Template ID:</span>
                  <span className="font-mono text-dark-1 font-bold">
                    #{selectedSubmission.form_id}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-tertiary/40">
                  <span>Submitted At:</span>
                  <span className="font-mono text-dark-1 font-bold">
                    {formatDate(selectedSubmission.submitted_at)}
                  </span>
                </div>
                {selectedSubmission.submitter_id && (
                  <div className="flex justify-between py-1 border-b border-neutral-tertiary/40">
                    <span>Submitter User ID:</span>
                    <span className="font-mono text-dark-1 font-bold">
                      #{selectedSubmission.submitter_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-quaternary/40 border-t border-neutral-tertiary flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 bg-primary-base hover:bg-opacity-95 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
