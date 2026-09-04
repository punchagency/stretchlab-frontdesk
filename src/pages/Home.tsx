import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Navigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getFrontdeskHome,
  IntakeSubmission,
  FirstTimerRecord,
  StudioLocation,
} from "../service/home";
import { getUserCookie } from "../utils/user";
import {
  FileText,
  MapPin,
  Calendar,
  Search,
  RotateCcw,
  User,
  // Phone,
  X,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  Eye,
} from "lucide-react";

import { DataTable, ErrorHandle, IntakeEmailModal } from "../components/shared";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { IntakeConversion } from "./IntakeConversion";


export const Home = () => {
  const token = getUserCookie();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"submissions" | "performance">(
    tabParam === "performance" ? "performance" : "submissions"
  );

  const [subView, setSubView] = useState<"first_timers" | "submissions">("first_timers");

  useEffect(() => {
    if (tabParam === "performance") {
      setActiveTab("performance");
    } else {
      setActiveTab("submissions");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "submissions" | "performance") => {
    setActiveTab(tab);
    setSearchParams(tab === "performance" ? { tab: "performance" } : {});
  };

  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [selectedSubmission, setSelectedSubmission] =
    useState<IntakeSubmission | null>(null);
  const [emailSubmissionId, setEmailSubmissionId] = useState<number | string | null>(null);

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
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["frontdesk-home", homeQueryParams],
    queryFn: async () => {
      const response = await getFrontdeskHome(homeQueryParams);
      return response.data?.data;
    },
  });

  const submissions: IntakeSubmission[] = homeData?.submissions || [];
  const firstTimers: FirstTimerRecord[] = homeData?.first_timers || [];
  const locations: StudioLocation[] = homeData?.locations || [];
  const totalSubmissions = homeData?.pagination?.total || submissions.length;
  const totalPages = homeData?.pagination?.total_pages || 1;

  const matchedFirstTimers = firstTimers.filter((ft) => ft.matched || ft.submission !== null).length;
  const matchedSubmissions = submissions.filter((sub) => sub.matched || sub.first_timer !== null).length;

  const handleResetFilters = () => {
    setSelectedLocation("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const filteredFirstTimers = firstTimers.filter((ft) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      (ft.client_name || "").toLowerCase().includes(query) ||
      (ft.location_name || ft.location || "").toLowerCase().includes(query) ||
      (ft.instructor || ft.flexologist_name || "").toLowerCase().includes(query) ||
      (ft.booking_name || "").toLowerCase().includes(query) ||
      (ft.email || "").toLowerCase().includes(query) ||
      (ft.cellphone || "").toLowerCase().includes(query) ||
      String(ft.clubready_user_id || ft.customer_id || "").includes(query) ||
      String(ft.id).includes(query)
    );
  });

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

  const formatApptDate = (ft?: FirstTimerRecord | null) => {
    if (!ft) return "N/A";
    if (ft.booking_date) {
      try {
        const dateParts = ft.booking_date.split("-");
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const monthIndex = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];
          const formattedDateStr = `${monthNames[monthIndex]} ${day}, ${year}`;
          if (ft.booking_time) {
            return `${formattedDateStr}, ${ft.booking_time}`;
          }
          return formattedDateStr;
        }
      } catch (e) {
        console.error("Error formatting booking_date:", e);
      }
      return ft.booking_time ? `${ft.booking_date}, ${ft.booking_time}` : ft.booking_date;
    }
    return formatDate(ft.appointment_date);
  };

  const firstTimersColumns = [
    {
      header: "Client Name",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const userId = ft.clubready_user_id || ft.customer_id || ft.id;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-base/10 text-primary-base font-bold flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-dark-1 text-xs">
                {ft.client_name || "Unknown Client"}
              </p>
              <p className="text-[10px] text-grey-2 font-mono">
                ID #{userId}
                {ft.email ? ` • ${ft.email}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Phone Number",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const phone = ft.cellphone;
        return (
          <span className="text-grey-5 font-mono text-[11px] inline-flex items-center gap-1">
            {/* <Phone className="w-3 h-3 text-grey-2 shrink-0" /> */}
            {phone || "N/A"}
          </span>
        );
      },
    },
    {
      header: "Appointment Date",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-grey-5 font-mono text-[11px] font-semibold">
              {formatApptDate(ft)}
            </span>

          </div>
        );
      },
    },
    {
      header: "Studio Location",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-dark-1 bg-neutral-quaternary px-2.5 py-1 rounded-lg border border-neutral-tertiary">
            <MapPin className="w-3 h-3 text-grey-2" />
            {ft.location_name || ft.location || `Location #${ft.location_id}`}
          </span>
        );
      },
    },
    {
      header: "Flexologist",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        return (
          <span className="text-xs font-semibold text-dark-1 capitalize">
            {ft.instructor || ft.flexologist_name || "N/A"}
          </span>
        );
      },
    },
    {
      header: "Intake Form Status",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const sub = ft.submission;
        const isMatched = ft.matched || (sub !== null && sub !== undefined);
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isMatched
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
          >
            {isMatched ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>✓ Intake Completed</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>⚠️ Missing Intake Form</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const sub = ft.submission;
        return sub ? (
          <button
            onClick={() => setSelectedSubmission(sub)}
            className="px-3 py-1.5 bg-primary-base/10 text-primary-base hover:bg-primary-base/20 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            View Details
          </button>
        ) : (
          <span className="text-xs text-grey-2 font-mono">No Submission</span>
        );
      },
    },
  ];

  const submissionColumns = [
    {
      header: "Submitter Name",
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
      header: "Visit Match Status",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        const ft = sub.first_timer;
        const isMatched = sub.matched || ft !== null;
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isMatched
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
          >
            {isMatched ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>✓ Matched to First Visit</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>⚠️ Unmatched</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        return (
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setEmailSubmissionId(sub.id)}
                    className="p-1.5 rounded-lg text-primary-base hover:bg-primary-base/10 transition-colors cursor-pointer border border-transparent hover:border-primary-base/20"
                    aria-label="Email Intake Form & AI Summary to Studio Team"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold text-[11px]">Email to Studio Team</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedSubmission(sub)}
                    className="p-1.5 rounded-lg text-primary-base hover:bg-primary-base/10 transition-colors cursor-pointer border border-transparent hover:border-primary-base/20"
                    aria-label="View Submission Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold text-[11px]">View Submission Details</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },



  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20">
                FrontDesk Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
              First Visits
            </h1>
            <p className="text-grey-5 text-xs sm:text-sm mt-1 font-medium">
              Manage first visit intake form submissions and performance metrics
            </p>
          </div>

          {activeTab === "submissions" && (
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
          )}
        </div>

        {/* Top Pill Tabs */}
        <div className="flex flex-wrap items-center justify-between border-t border-neutral-tertiary/60 pt-4 gap-4">
          <div className="inline-flex items-center p-1.5 bg-neutral-quaternary rounded-2xl border border-neutral-tertiary">
            <button
              type="button"
              onClick={() => handleTabChange("submissions")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center gap-2 ${activeTab === "submissions"
                ? "bg-white text-primary-base shadow-sm border border-neutral-tertiary"
                : "text-grey-5 hover:text-dark-1 hover:bg-white/50"
                }`}
            >
              <MapPin className="w-4 h-4" />
              <span>First Visit Submissions</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("performance")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center gap-2 ${activeTab === "performance"
                ? "bg-white text-primary-base shadow-sm border border-neutral-tertiary"
                : "text-grey-5 hover:text-dark-1 hover:bg-white/50"
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Performance</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "performance" ? (
        <IntakeConversion hideHeader={true} />
      ) : (
        <>
          {/* Metrics Rollup Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
                  First-Time Visits
                </p>
                <h3 className="text-2xl font-black text-dark-1 mt-1">
                  {firstTimers.length}
                </h3>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                  ✓ {matchedFirstTimers} with intake form
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
                  Intake Submissions
                </p>
                <h3 className="text-2xl font-black text-dark-1 mt-1">
                  {totalSubmissions}
                </h3>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                  ✓ {matchedSubmissions} matched to visit
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex items-center justify-between sm:col-span-1 col-span-1">
              <div>
                <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
                  Active Studios
                </p>
                <h3 className="text-2xl font-black text-dark-1 mt-1">
                  {locations.length}
                </h3>
                <p className="text-[11px] text-grey-5 font-semibold mt-0.5">
                  Studio locations configured
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neutral-quaternary text-dark-1 border border-neutral-tertiary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-grey-5" />
              </div>
            </div>
          </div>

          {/* Sub-view Switcher & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-tertiary shadow-xs space-y-4">
            {/* View Switcher Sub-tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-tertiary/60 pb-3">
              <button
                type="button"
                onClick={() => setSubView("first_timers")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${subView === "first_timers"
                  ? "bg-primary-base text-white shadow-xs"
                  : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
                  }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>First Visits ({firstTimers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubView("submissions")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${subView === "submissions"
                  ? "bg-primary-base text-white shadow-xs"
                  : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Intake Form Submissions ({submissions.length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
                <input
                  type="text"
                  placeholder={
                    subView === "first_timers"
                      ? "Search client name, flexologist, location..."
                      : "Search client name, location, form ID..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

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
                    className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all"
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

                {/* Date Filters */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-grey-2 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all"
                  />
                  <span className="text-xs text-grey-5 font-bold">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all"
                  />
                </div>

                {(selectedLocation || startDate || endDate || search) && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submissions or First Timers Data Table */}
          <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-grey-5 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base"></div>
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  Loading data feed...
                </p>
              </div>
            ) : isError ? (
              <ErrorHandle
                message="Failed to load frontdesk data feed."
                retry={() => refetch()}
              />
            ) : subView === "first_timers" ? (
              <DataTable
                columns={firstTimersColumns}
                data={filteredFirstTimers}
                isLoading={isLoading}
                enableSorting={true}
                rowId={(row: FirstTimerRecord) => `first-timer-row-${row.id}`}
                rowClassName={(row: FirstTimerRecord) =>
                  row.submission
                    ? "bg-emerald-50/60 border-l-4 border-primary font-semibold transition-all duration-300"
                    : ""
                }
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: totalPages,
                  onPaginationChange: (state) => {
                    setPage(state.pageIndex + 1);
                  },
                  totalCount: homeData?.pagination?.total || firstTimers.length,
                }}
              />
            ) : (
              <DataTable
                columns={submissionColumns}
                data={filteredSubmissions}
                isLoading={isLoading}
                enableSorting={true}
                rowId={(row: IntakeSubmission) => `submission-row-${row.id}`}

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
        </>
      )}

      {/* View Submission & Match Inspection Modal Drawer Portal */}
      {selectedSubmission &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-2xl w-full max-w-xl overflow-hidden space-y-4 my-auto relative z-[100000]">
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
                      Submission #{selectedSubmission.id}
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

              <div className="p-6 space-y-5 text-xs font-semibold text-grey-5">
                {/* Dual Match Comparison Card */}
                {selectedSubmission.first_timer ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Verified Match Pair
                      </span>
                      <span className="text-[10px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                        Matched by Client ID #{selectedSubmission.submitter_id || selectedSubmission.first_timer.clubready_user_id || selectedSubmission.first_timer.customer_id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* ClubReady Booking Profile */}
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-grey-2 uppercase block">
                          1. ClubReady Schedule Account
                        </span>
                        <p className="font-black text-dark-1 text-sm">
                          {selectedSubmission.first_timer.client_name || "N/A"}
                        </p>
                        <p className="text-[11px] text-grey-5 font-mono">
                          Member ID #{selectedSubmission.first_timer.clubready_user_id || selectedSubmission.first_timer.customer_id || selectedSubmission.first_timer.id}
                        </p>
                        <p className="text-[11px] text-grey-5 font-mono">
                          Appt: {formatApptDate(selectedSubmission.first_timer)}
                        </p>
                        <p className="text-[11px] text-grey-5">
                          Flexologist: {selectedSubmission.first_timer.instructor || selectedSubmission.first_timer.flexologist_name || "N/A"}
                        </p>
                      </div>

                      {/* Intake Form Submission */}
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-grey-2 uppercase block">
                          2. Intake Form Submitter
                        </span>
                        <p className="font-black text-dark-1 text-sm">
                          {selectedSubmission.client_name || "N/A"}
                        </p>
                        <p className="text-[11px] text-grey-5 font-mono">
                          Submitter ID #{selectedSubmission.submitter_id}
                        </p>
                        <p className="text-[11px] text-grey-5 font-mono">
                          Submitted: {formatDate(selectedSubmission.submitted_at)}
                        </p>
                        <p className="text-[11px] text-grey-5 font-mono">
                          Form ID #{selectedSubmission.form_id}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* General Submission Attributes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-0.5">
                    <span className="text-[10px] text-grey-2 font-bold uppercase block">
                      Form Submitter Name
                    </span>
                    <span className="font-black text-dark-1 text-sm">
                      {selectedSubmission.client_name || "N/A"}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-0.5">
                    <span className="text-[10px] text-grey-2 font-bold uppercase block">
                      Submitter ID
                    </span>
                    <span className="font-mono font-bold text-dark-1 text-xs">
                      #{selectedSubmission.submitter_id || selectedSubmission.id}
                    </span>
                  </div>

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
                    <span className="font-bold text-emerald-600 text-xs uppercase">
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

              <div className="p-4 bg-neutral-quaternary/40 border-t border-neutral-tertiary flex items-end justify-end gap-3 ">
                {/* <button
                  onClick={() => setEmailSubmissionId(selectedSubmission.id)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email to Studio Team</span>
                </button> */}
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-5 py-2 bg-primary-base hover:bg-opacity-95 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Email Preview & Dispatch Modal */}
      <IntakeEmailModal
        isOpen={!!emailSubmissionId}
        submissionId={emailSubmissionId}
        onClose={() => setEmailSubmissionId(null)}
      />
    </div>
  );
};
