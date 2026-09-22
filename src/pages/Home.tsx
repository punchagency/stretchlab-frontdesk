import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Navigate, useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFrontdeskHome,
  checkFollowUp,
  uncheckFollowUp,
  refreshDay,
  visitOf,
  IntakeSubmission,
  FirstTimerRecord,
  StudioLocation,
  RefreshOutcome,
  VisitKey,
  FrontdeskHomeResponse,
} from "../service/home";
import { getUserCookie } from "../utils/user";
import {
  FileText,
  MapPin,
  Calendar,
  Search,
  X,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  Eye,
  ChevronDown,
  CheckSquare,
  Square,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { DataTable, ErrorHandle, IntakeEmailModal, IntakeInsightsPanel } from "../components/shared";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { renderSuccessToast, renderErrorToast } from "../utils/toast";
import { IntakeConversion } from "./IntakeConversion";

export const Home = () => {
  const token = getUserCookie();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"submissions" | "performance" | "insights">(
    tabParam === "performance" ? "performance" : tabParam === "insights" ? "insights" : "submissions"
  );

  const [subView, setSubView] = useState<"first_timers" | "submissions">("first_timers");

  useEffect(() => {
    if (tabParam === "performance") {
      setActiveTab("performance");
    } else if (tabParam === "insights") {
      setActiveTab("insights");
    } else {
      setActiveTab("submissions");
    }
  }, [tabParam]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNoteModalVisit(null);
        setSelectedSubmission(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const handleTabChange = (tab: "submissions" | "performance" | "insights") => {
    setActiveTab(tab);
    setSearchParams(tab === "submissions" ? {} : { tab });
  };

  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [selectedSubmission, setSelectedSubmission] = useState<IntakeSubmission | null>(null);
  const [emailSubmissionId, setEmailSubmissionId] = useState<number | string | null>(null);

  // Follow-up note modal state
  const [noteModalVisit, setNoteModalVisit] = useState<{
    row: FirstTimerRecord;
    noteText: string;
  } | null>(null);

  // Follow-up mutation loading states
  const [togglingVisitKey, setTogglingVisitKey] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);



  // ClubReady Live Refresh state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshBanner, setRefreshBanner] = useState<{
    type: "success" | "warning" | "error";
    title: string;
    description: string;
    outcomes?: RefreshOutcome[];
  } | null>(null);

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

  const [statusFilter, setStatusFilter] = useState<"all" | "missing" | "completed">("all");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

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

  const todayStr = getIsoDateStr(0);
  const tomorrowStr = getIsoDateStr(1);
  const isTodaySelected = startDate === todayStr && endDate === todayStr && !showCustomDatePicker;
  const isTomorrowSelected = startDate === tomorrowStr && endDate === tomorrowStr && !showCustomDatePicker;
  const isCustomDateSelected = Boolean(
    showCustomDatePicker || ((startDate || endDate) && !isTodaySelected && !isTomorrowSelected)
  );

  // Maximum date allowed for Date Picker (upcoming_from + 14 days)
  const upcomingFromDate = homeData?.window?.upcoming_from || todayStr;
  const getMaxDateStr = (baseDateStr: string) => {
    try {
      const parts = baseDateStr.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 14);
      return localDay(d);
    } catch {
      return getIsoDateStr(14);
    }
  };
  const maxAllowedDate = getMaxDateStr(upcomingFromDate);

  const formatIsoDateLabel = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        return `${monthNames[monthIndex]} ${day}, ${year}`;
      }
    } catch {
      return dateStr;
    }
    return dateStr;
  };

  const formatUtcTimestamp = (stamp?: string | null) => {
    if (!stamp) return "";
    try {
      const d = new Date(stamp.endsWith("Z") ? stamp : stamp + "Z");
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return stamp;
    }
  };

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return "FT";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const submissions: IntakeSubmission[] = homeData?.submissions || [];
  const firstTimers: FirstTimerRecord[] = homeData?.first_timers || [];
  const locations: StudioLocation[] = homeData?.locations || [];

  const summary = homeData?.summary;
  const firstTimersTotal =
    summary?.first_timers_total ?? homeData?.pagination?.total ?? firstTimers.length;
  const submissionsTotal =
    summary?.submissions_total ?? homeData?.pagination?.total ?? submissions.length;
  const firstTimersFollowedUp = summary?.first_timers_followed_up ?? 0;

  const matchedFirstTimers =
    summary?.first_timers_matched ??
    firstTimers.filter((ft) => ft.matched || ft.submission !== null).length;
  const matchedSubmissions =
    summary?.submissions_matched ??
    submissions.filter((sub) => sub.matched || sub.first_timer !== null).length;

  const unmatchedFirstTimers =
    summary?.first_timers_unmatched ??
    firstTimers.filter((ft) => !ft.matched && !ft.submission).length;
  const unmatchedSubmissions =
    summary?.submissions_unmatched ??
    submissions.filter((sub) => !sub.matched && !sub.first_timer).length;

  const totalPages = homeData?.pagination?.total_pages || 1;

  const handleResetFilters = () => {
    setSelectedLocation("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setStatusFilter("all");
    setShowCustomDatePicker(false);
    setPage(1);
  };

  // Follow-up mutation with instant Optimistic UI updates
  const followUpMutation = useMutation({
    mutationFn: async ({
      visitKey,
      shouldCheck,
      note,
    }: {
      visitKey: VisitKey;
      shouldCheck: boolean;
      note?: string;
    }) => {
      if (!shouldCheck) {
        return await uncheckFollowUp(visitKey);
      } else {
        return await checkFollowUp(visitKey, note);
      }
    },
    onMutate: async ({ visitKey, shouldCheck, note }) => {
      await queryClient.cancelQueries({ queryKey: ["frontdesk-home", homeQueryParams] });
      const previousData = queryClient.getQueryData<FrontdeskHomeResponse["data"]>([
        "frontdesk-home",
        homeQueryParams,
      ]);

      if (previousData) {
        const updatedFirstTimers = previousData.first_timers.map((ft) => {
          if (
            ft.location_id === visitKey.location_id &&
            ft.clubready_user_id === visitKey.clubready_user_id &&
            ft.booking_date === visitKey.booking_date
          ) {
            const newFollowUp = !shouldCheck
              ? null
              : {
                checked: true,
                checked_at: new Date().toISOString(),
                checked_by: null,
                checked_by_name: "You",
                note: note !== undefined ? note : ft.follow_up?.note || null,
              };
            return { ...ft, follow_up: newFollowUp };
          }
          return ft;
        });

        const updatedFollowedUpCount = updatedFirstTimers.filter((ft) => ft.follow_up?.checked).length;

        queryClient.setQueryData(["frontdesk-home", homeQueryParams], {
          ...previousData,
          first_timers: updatedFirstTimers,
          summary: previousData.summary
            ? { ...previousData.summary, first_timers_followed_up: updatedFollowedUpCount }
            : undefined,
        });

        // Keep local drawer state in sync if drawer is open for this row
        if (noteModalVisit && noteModalVisit.row.clubready_user_id === visitKey.clubready_user_id) {
          const updatedRow = updatedFirstTimers.find(
            (ft) => ft.clubready_user_id === visitKey.clubready_user_id
          );
          if (updatedRow) {
            setNoteModalVisit((prev) => (prev ? { ...prev, row: updatedRow } : null));
          }
        }
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["frontdesk-home", homeQueryParams], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["frontdesk-home", homeQueryParams] });
    },
  });

  // Follow-up toggle handler (Instant Optimistic UI with loading & toast feedback)
  const handleToggleFollowUp = (row: FirstTimerRecord) => {
    if (!row.clubready_user_id || !row.location_id || !row.booking_date) return;
    const isChecked = Boolean(row.follow_up?.checked);
    const visitKey = visitOf(row);
    const rowKey = `${visitKey.location_id}:${visitKey.clubready_user_id}:${visitKey.booking_date}`;

    setTogglingVisitKey(rowKey);

    followUpMutation.mutate(
      {
        visitKey,
        shouldCheck: !isChecked,
      },
      {
        onSuccess: () => {
          if (!isChecked) {
            renderSuccessToast(
              row.client_name
                ? `Follow-up completed for ${row.client_name}`
                : "Follow-up completed successfully"
            );
          } else {
            renderSuccessToast(
              row.client_name
                ? `Follow-up removed for ${row.client_name}`
                : "Follow-up removed successfully"
            );
          }
        },
        onError: (err: any) => {
          renderErrorToast(err?.response?.data?.message || err?.message || "Failed to update follow-up");
        },
        onSettled: () => {
          setTogglingVisitKey(null);
        },
      }
    );
  };

  // Follow-up note save handler (with loading spinner & toast feedback)
  const handleSaveNote = () => {
    if (!noteModalVisit) return;
    const { row, noteText } = noteModalVisit;
    if (!row.clubready_user_id || !row.location_id || !row.booking_date) return;

    setIsSavingNote(true);

    followUpMutation.mutate(
      {
        visitKey: visitOf(row),
        shouldCheck: true,
        note: noteText,
      },
      {
        onSuccess: () => {
          renderSuccessToast("Follow-up note saved successfully");
          setNoteModalVisit(null);
        },
        onError: (err: any) => {
          renderErrorToast(err?.response?.data?.message || err?.message || "Failed to save follow-up note");
        },
        onSettled: () => {
          setIsSavingNote(false);
        },
      }
    );
  };


  // Live ClubReady Refresh handler
  const handleLiveRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshBanner(null);

    const targetDay = startDate || endDate || todayStr;

    try {
      const res = await refreshDay(targetDay, selectedLocation || undefined);
      if (res.status === "success") {
        setRefreshBanner({
          type: "success",
          title: "Refresh Completed",
          description: `Successfully refreshed ${res.data.summary.refreshed} location(s) from ClubReady for ${targetDay}.`,
          outcomes: res.data.locations,
        });
      } else if (res.status === "partial") {
        setRefreshBanner({
          type: "warning",
          title: "Partial Refresh Completed",
          description: `${res.data.summary.refreshed} location(s) refreshed, but ${res.data.summary.failed} location(s) couldn't be updated right now.`,
          outcomes: res.data.locations,
        });
      } else {
        setRefreshBanner({
          type: "error",
          title: "Refresh Failed",
          description: "Could not refresh first visit records from ClubReady at this time. Please try again shortly.",
          outcomes: res.data.locations,
        });
      }
      refetch();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setRefreshBanner({
          type: "warning",
          title: "Refresh Already In Progress",
          description: "Someone is already refreshing ClubReady records for this studio. Please try again in a couple of minutes.",
        });
      } else {
        setRefreshBanner({
          type: "error",
          title: "Refresh Request Failed",
          description: err.response?.data?.message || err.message || "Failed to trigger live refresh.",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredFirstTimers = firstTimers.filter((ft) => {
    const isMatched = ft.matched || ft.submission !== null;
    if (statusFilter === "missing" && isMatched) return false;
    if (statusFilter === "completed" && !isMatched) return false;

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

  const formatApptDateOnly = (ft?: FirstTimerRecord | null) => {
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
          return `${monthNames[monthIndex]} ${day}, ${year}`;
        }
      } catch (e) {
        console.error("Error formatting booking_date:", e);
      }
      return ft.booking_date;
    }
    return formatDate(ft.appointment_date);
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
      header: "Follow Up",
      size: 110,
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const isCompleted = ft.matched || (ft.submission !== null && ft.submission !== undefined);

        if (isCompleted) {
          return (
            <span className="text-[11px] text-grey-2 font-mono italic flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Form Received
            </span>
          );
        }

        const followUp = ft.follow_up;
        const isChecked = Boolean(followUp?.checked);
        const rowKey = `${ft.location_id}:${ft.clubready_user_id}:${ft.booking_date}`;
        const isThisRowToggling = togglingVisitKey === rowKey;

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={isThisRowToggling}
                    onClick={() => handleToggleFollowUp(ft)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-70 ${isChecked
                      ? "bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-100"
                      : "bg-white text-zinc-400 border-zinc-300 hover:border-zinc-400 hover:text-zinc-600"
                      }`}
                  >
                    {isThisRowToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-base" />
                    ) : isChecked ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-100" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isChecked ? (
                    <div className="text-[11px] font-medium space-y-0.5">
                      <p className="font-bold text-emerald-400">Follow-up Completed</p>
                      {followUp?.checked_by_name && (
                        <p>Checked by: {followUp.checked_by_name}</p>
                      )}
                      {followUp?.checked_at && (
                        <p>Time: {formatUtcTimestamp(followUp.checked_at)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-semibold text-[11px]">Mark Followed Up (Reminded/Handed Form)</p>
                  )}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      setNoteModalVisit({ row: ft, noteText: followUp?.note || "" })
                    }
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${followUp?.note
                      ? "bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100"
                      : "bg-white text-zinc-300 border-zinc-200 hover:border-zinc-300 hover:text-zinc-500"
                      }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold text-[11px]">
                    {followUp?.note ? `Note: "${followUp.note}"` : "Add Follow-up Note"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },

    {
      header: "Client Name",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const userId = ft.clubready_user_id || ft.customer_id || ft.id;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-base/10 text-primary-base font-black text-[11px] flex items-center justify-center shrink-0 border border-primary-base/20">
              {getInitials(ft.client_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-dark-1 text-xs">
                  {ft.client_name || "Unknown Client"}
                </p>
                {ft.stale && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-700 rounded border border-zinc-300">
                          Stale
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-[11px]">
                          Scrape missed last night. Last seen: {formatUtcTimestamp(ft.last_seen_at)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
          <span className="text-grey-5 font-mono text-[11px] inline-flex items-center gap-1 font-medium">
            {phone || "—"}
          </span>
        );
      },
    },
    {
      header: "Appointment Date",
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const isApptToday = ft.booking_date === todayStr;
        const isApptTomorrow = ft.booking_date === tomorrowStr;

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-dark-1 font-bold text-xs font-mono">
                {formatApptDateOnly(ft)}
              </span>
              {isApptToday && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-primary-base text-white tracking-wide">
                  Today
                </span>
              )}
              {isApptTomorrow && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 tracking-wide">
                  Tomorrow
                </span>
              )}
            </div>
            {ft.booking_time ? (
              <span className="text-[11px] text-grey-5 font-semibold">
                {ft.booking_time}
              </span>
            ) : null}
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
            <MapPin className="w-5 h-5 text-grey-2" />
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
      size: 220,
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const sub = ft.submission;
        const isMatched = ft.matched || (sub !== null && sub !== undefined);
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 ${isMatched
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
              }`}
          >
            {isMatched ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>✓ Intake Completed</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>⚠️ Missing Intake Form</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Actions",
      size: 160,
      cell: ({ row }: any) => {
        const ft: FirstTimerRecord = row.original;
        const sub = ft.submission;
        return sub ? (
          <button
            onClick={() => setSelectedSubmission(sub)}
            className="px-3.5 py-1.5 bg-primary-base/10 text-primary-base hover:bg-primary-base/20 font-bold rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            View Details
          </button>
        ) : (
          <span className="text-xs text-grey-2 font-mono whitespace-nowrap">No Submission</span>
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
            <MapPin className="w-5 h-5 text-grey-2" />
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
      size: 240,
      cell: ({ row }: any) => {
        const sub: IntakeSubmission = row.original;
        const ft = sub.first_timer;
        const isMatched = sub.matched || ft !== null;
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 ${isMatched
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
          >
            {isMatched ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>✓ Matched to First Visit</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>⚠️ Unmatched</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Actions",
      size: 160,
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
              Manage first visit intake form submissions, client follow-up checklists, and studio conversion metrics
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {/* ClubReady Live Refresh Button */}
            {activeTab === "submissions" && (
              <button
                onClick={handleLiveRefresh}
                disabled={isRefreshing || isRefetching}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#368591] hover:bg-[#2c6d77] text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing ClubReady..." : "Refresh from ClubReady"}
              </button>
            )}
          </div>
        </div>

        {/* Live Refresh Outcome Banner */}
        {refreshBanner && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in duration-200 text-xs ${refreshBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : refreshBanner.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
          >
            <div className="flex items-start gap-2.5">
              {refreshBanner.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : refreshBanner.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-extrabold text-sm">{refreshBanner.title}</h4>
                <p className="mt-0.5 font-medium">{refreshBanner.description}</p>

                {refreshBanner.outcomes && refreshBanner.outcomes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {refreshBanner.outcomes.map((loc, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.status === "refreshed"
                          ? "bg-emerald-100 text-emerald-800"
                          : loc.status === "failed"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-zinc-100 text-zinc-700"
                          }`}
                      >
                        {loc.location_name}: {loc.status === "refreshed" ? `${loc.first_visits || 0} visits` : loc.status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setRefreshBanner(null)}
              className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upcoming Not Available Banner */}
        {homeData?.window && homeData.window.upcoming_as_of === null && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">Upcoming visits aren't available yet</h4>
              <p className="mt-0.5 font-medium">
                The nightly look-ahead process has not run for this studio yet. Past visits report data remains available. Use "Refresh from ClubReady" to load today's visits.
              </p>
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={() => handleTabChange("insights")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center gap-2 ${activeTab === "insights"
                ? "bg-white text-primary-base shadow-sm border border-neutral-tertiary"
                : "text-grey-5 hover:text-dark-1 hover:bg-white/50"
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Intake Insights</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "performance" ? (
        <IntakeConversion hideHeader={true} />
      ) : activeTab === "insights" ? (
        <IntakeInsightsPanel selectedLocationId={selectedLocation || undefined} />
      ) : (
        <>
          {/* Metrics Rollup Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: First-Time Visits */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSubView("first_timers");
                setStatusFilter("all");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSubView("first_timers");
                  setStatusFilter("all");
                }
              }}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer select-none hover:shadow-md text-left ${subView === "first_timers" && statusFilter === "all"
                ? "border-primary-base/50 ring-2 ring-primary-base/20 shadow-xs"
                : "border-neutral-tertiary hover:border-primary-base/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
                    First-Time Visits
                  </p>
                  <h3 className="text-2xl font-black text-dark-1 mt-1">
                    {firstTimersTotal}
                  </h3>
                  <p className="text-[11px] text-grey-5 font-bold mt-0.5">
                    {firstTimersTotal > 0
                      ? `${Math.round((matchedFirstTimers / firstTimersTotal) * 100)}% intake completed (${matchedFirstTimers}/${firstTimersTotal})`
                      : "No visits in range"}
                  </p>
                  {firstTimersFollowedUp > 0 && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> {firstTimersFollowedUp} followed up by desk
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 2: Missing Intake Forms */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSubView("first_timers");
                setStatusFilter("missing");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSubView("first_timers");
                  setStatusFilter("missing");
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none hover:shadow-md text-left ${subView === "first_timers" && statusFilter === "missing"
                ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-xs"
                : "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                      Missing Intake Forms
                    </p>
                    {unmatchedFirstTimers > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-200/80 text-amber-900 animate-pulse">
                        Action
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-amber-900 mt-1">
                    {unmatchedFirstTimers}
                  </h3>
                  <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                    {unmatchedFirstTimers > 0
                      ? "Click to view missing forms →"
                      : "✓ All first-timers have forms"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 3: Intake Submissions */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSubView("submissions")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSubView("submissions");
                }
              }}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer select-none hover:shadow-md text-left ${subView === "submissions"
                ? "border-primary-base/50 ring-2 ring-primary-base/20 shadow-xs"
                : "border-neutral-tertiary hover:border-primary-base/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-grey-2 uppercase tracking-wider">
                    Intake Submissions
                  </p>
                  <h3 className="text-2xl font-black text-dark-1 mt-1">
                    {submissionsTotal}
                  </h3>
                  <p className="text-[11px] text-grey-5 font-bold mt-0.5">
                    ✓ {matchedSubmissions} matched · {unmatchedSubmissions} unmatched
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-view Switcher & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-tertiary shadow-xs space-y-4">
            {/* View Switcher Sub-tabs & Scope Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-tertiary/60 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubView("first_timers");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${subView === "first_timers"
                    ? "bg-primary-base text-white shadow-xs"
                    : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>First Visits ({firstTimersTotal})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubView("submissions");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${subView === "submissions"
                    ? "bg-primary-base text-white shadow-xs"
                    : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Intake Form Submissions ({submissionsTotal})</span>
                </button>
              </div>

              {/* Active Date Scope Indicator */}
              <div className="flex items-center gap-2">
                {subView === "first_timers" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-bold text-grey-5">
                    <Calendar className="w-3.5 h-3.5 text-primary-base" />
                    <span>
                      {isTodaySelected
                        ? `Showing: Today (${formatIsoDateLabel(todayStr)})`
                        : isTomorrowSelected
                          ? `Showing: Tomorrow (${formatIsoDateLabel(tomorrowStr)})`
                          : startDate && endDate
                            ? `Showing: ${formatIsoDateLabel(startDate)} – ${formatIsoDateLabel(endDate)}`
                            : startDate
                              ? `Showing from: ${formatIsoDateLabel(startDate)}`
                              : endDate
                                ? `Showing to: ${formatIsoDateLabel(endDate)}`
                                : "Showing: Yesterday & Today (Default)"}
                    </span>
                  </div>
                ) : (
                  (startDate || endDate) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-bold text-grey-5">
                      <Calendar className="w-3.5 h-3.5 text-primary-base" />
                      <span>
                        {startDate && endDate
                          ? `${formatIsoDateLabel(startDate)} – ${formatIsoDateLabel(endDate)}`
                          : startDate
                            ? `From: ${formatIsoDateLabel(startDate)}`
                            : `To: ${formatIsoDateLabel(endDate)}`}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
                <input
                  type="text"
                  placeholder={
                    subView === "first_timers"
                      ? "Search client name, flexologist, location..."
                      : "Search submitter name, location, form ID..."
                  }
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

              {/* Status Filter Pills (Only for First Visits view) */}
              {subView === "first_timers" && (
                <div className="flex items-center gap-1.5 p-1 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-2xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${statusFilter === "all"
                      ? "bg-dark-1 text-white shadow-2xs"
                      : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                      }`}
                  >
                    All ({firstTimersTotal})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter("missing")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${statusFilter === "missing"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60"
                      }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Missing Form ({unmatchedFirstTimers})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${statusFilter === "completed"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60"
                      }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed ({matchedFirstTimers})</span>
                  </button>
                </div>
              )}

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

                {/* Quick Appointment Date Buttons & Custom Range Toggle (First Visits view only) */}
                {subView === "first_timers" ? (
                  <div className="flex items-center p-1 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate(todayStr);
                        setEndDate(todayStr);
                        setShowCustomDatePicker(false);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${isTodaySelected
                        ? "bg-primary-base text-white shadow-2xs"
                        : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                        }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate(tomorrowStr);
                        setEndDate(tomorrowStr);
                        setShowCustomDatePicker(false);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${isTomorrowSelected
                        ? "bg-primary-base text-white shadow-2xs"
                        : "text-grey-5 hover:text-dark-1 hover:bg-white/60"
                        }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (showCustomDatePicker) {
                          setShowCustomDatePicker(false);
                        } else {
                          setShowCustomDatePicker(true);
                          if (startDate === todayStr || startDate === tomorrowStr) {
                            setStartDate("");
                            setEndDate("");
                            setPage(1);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${isCustomDateSelected
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
                ) : (
                  /* Standard Date Range Inputs for Submissions View */
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
                )}

                {/* Reset Filters Button */}
                {(selectedLocation || startDate || endDate || search || (subView === "first_timers" && statusFilter !== "all")) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Custom Date Range Disclosure Drawer (Capped up to maxAllowedDate) */}
            {subView === "first_timers" && showCustomDatePicker && (
              <div className="pt-3 border-t border-neutral-tertiary/60 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-grey-5 uppercase">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    max={maxAllowedDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-2.5 py-1.5 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base shadow-2xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-grey-5 uppercase">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    max={maxAllowedDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-2.5 py-1.5 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(todayStr);
                    setEndDate(getIsoDateStr(7));
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-neutral-tertiary/40 border border-neutral-tertiary text-grey-5 hover:text-dark-1 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Next 7 Days
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Dates
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCustomDatePicker(false)}
                  className="ml-auto p-1.5 text-grey-2 hover:text-dark-1 cursor-pointer rounded-lg hover:bg-neutral-tertiary"
                  aria-label="Close date picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
                rowId={(row: FirstTimerRecord) => `${row.source || "upcoming"}:${row.id}`}
                rowClassName={(row: FirstTimerRecord) =>
                  row.submission || row.matched
                    ? "hover:bg-neutral-quaternary/40 font-semibold transition-all duration-200"
                    : "bg-amber-50/25 hover:bg-amber-50/50 font-semibold transition-all duration-200"
                }
                emptyMessage={
                  statusFilter === "missing" ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-dark-1">All Caught Up!</h4>
                        <p className="text-xs text-grey-5 max-w-sm mt-0.5">
                          Every first-visit client in this date range has completed their intake form.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className="px-3.5 py-1.5 bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-neutral-tertiary"
                      >
                        View All First Visits
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-quaternary text-grey-2 flex items-center justify-center border border-neutral-tertiary">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-dark-1">No First-Time Visits Found</h4>
                        <p className="text-xs text-grey-5 max-w-sm mt-0.5">
                          There are no first-time visits matching your active filters.
                        </p>
                      </div>
                      {(selectedLocation || startDate || endDate || search || statusFilter !== "all") && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-primary-base text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs hover:bg-primary-base/90"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  )
                }
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: Math.ceil((statusFilter === "all" ? firstTimersTotal : filteredFirstTimers.length) / pageSize) || totalPages,
                  onPaginationChange: (state) => {
                    setPage(state.pageIndex + 1);
                  },
                  totalCount: statusFilter === "all" ? firstTimersTotal : filteredFirstTimers.length,
                }}
              />
            ) : (
              <DataTable
                columns={submissionColumns}
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
                  pageCount: Math.ceil((search ? filteredSubmissions.length : submissionsTotal) / pageSize) || totalPages,
                  totalCount: search ? filteredSubmissions.length : submissionsTotal,
                  onPaginationChange: (state) => {
                    setPage(state.pageIndex + 1);
                  },
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Keyframe Animation for Right Drawer Slide */}
      <style>{`
        @keyframes drawerSlideInFromRight {
          0% { transform: translateX(100%); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes drawerBackdropFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-drawer-slide-in {
          animation: drawerSlideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .animate-backdrop-fade-in {
          animation: drawerBackdropFadeIn 0.22s ease-out forwards !important;
        }
      `}</style>

      {/* Follow-up Note Right Slide-over Drawer Portal */}
      {noteModalVisit &&
        createPortal(
          <div
            onClick={() => setNoteModalVisit(null)}
            className="fixed inset-0 z-[99998] flex justify-end bg-black/50 backdrop-blur-xs animate-backdrop-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full shadow-2xl border-l border-neutral-tertiary flex flex-col z-[99999] animate-drawer-slide-in"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-tertiary bg-neutral-quaternary/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-base/10 text-primary-base flex items-center justify-center font-black border border-primary-base/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-dark-1 text-base">Client Follow-up</h3>
                    <p className="text-xs text-grey-5 font-mono">
                      {noteModalVisit.row.client_name || "First Visit Client"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setNoteModalVisit(null)}
                  className="p-2 text-grey-2 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Client Profile Overview Card */}
                <div className="p-4 rounded-2xl bg-neutral-quaternary/50 border border-neutral-tertiary space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-black text-grey-2 uppercase tracking-wider">
                      Visit Summary
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${noteModalVisit.row.matched || noteModalVisit.row.submission
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                    >
                      {noteModalVisit.row.matched || noteModalVisit.row.submission
                        ? "✓ Intake Completed"
                        : "⚠️ Missing Intake Form"}
                    </span>
                  </div>

                  <div>
                    <p className="text-base font-black text-dark-1">
                      {noteModalVisit.row.client_name || "Unknown Client"}
                    </p>
                    <p className="text-xs text-grey-5 font-mono">
                      ID #{noteModalVisit.row.clubready_user_id || noteModalVisit.row.customer_id || noteModalVisit.row.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-neutral-tertiary/60 text-grey-5">
                    <div>
                      <span className="text-[10px] text-grey-2 block font-bold">Appt Date & Time</span>
                      <span className="text-dark-1 font-bold">{formatApptDate(noteModalVisit.row)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-grey-2 block font-bold">Location</span>
                      <span className="text-dark-1 font-bold">
                        {noteModalVisit.row.location_name || `Location #${noteModalVisit.row.location_id}`}
                      </span>
                    </div>
                    {noteModalVisit.row.cellphone && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-grey-2 block font-bold">Phone Number</span>
                        <span className="text-dark-1 font-mono">{noteModalVisit.row.cellphone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Checklist Action Card */}
                <div className="p-4 rounded-2xl border border-neutral-tertiary bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-dark-1">Follow-up Status</p>
                      <p className="text-[11px] text-grey-5 font-medium mt-0.5">
                        {noteModalVisit.row.follow_up?.checked
                          ? `Followed up by ${noteModalVisit.row.follow_up.checked_by_name || "Desk Staff"}`
                          : "Mark off when client has been reminded or handed the form"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={togglingVisitKey === `${noteModalVisit.row.location_id}:${noteModalVisit.row.clubready_user_id}:${noteModalVisit.row.booking_date}`}
                      onClick={() => handleToggleFollowUp(noteModalVisit.row)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-70 ${noteModalVisit.row.follow_up?.checked
                        ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                        : "bg-primary-base text-white shadow-2xs hover:bg-primary-base/90"
                        }`}
                    >
                      {togglingVisitKey === `${noteModalVisit.row.location_id}:${noteModalVisit.row.clubready_user_id}:${noteModalVisit.row.booking_date}` ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : noteModalVisit.row.follow_up?.checked ? (
                        <>
                          <CheckSquare className="w-4 h-4 fill-emerald-100" />
                          <span>Followed Up</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" />
                          <span>Mark Followed Up</span>
                        </>
                      )}
                    </button>
                  </div>

                  {noteModalVisit.row.follow_up?.checked_at && (
                    <p className="text-[10px] text-grey-2 font-mono border-t border-neutral-tertiary/40 pt-2">
                      Completed: {formatUtcTimestamp(noteModalVisit.row.follow_up.checked_at)}
                    </p>
                  )}
                </div>

                {/* Follow-up Note Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-grey-2 block">
                    Follow-up Note & Log Details
                  </label>
                  <textarea
                    value={noteModalVisit.noteText}
                    onChange={(e) =>
                      setNoteModalVisit({ ...noteModalVisit, noteText: e.target.value.slice(0, 500) })
                    }
                    placeholder="e.g. Texted form link at 10am, or client will fill form on arrival..."
                    className="w-full h-36 p-3.5 text-xs font-semibold border border-neutral-tertiary rounded-2xl bg-neutral-quaternary/30 text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all shadow-2xs"
                  />
                  <div className="flex justify-between items-center text-[10px] text-grey-2 font-mono">
                    <span>Max 500 characters</span>
                    <span>{noteModalVisit.noteText.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-neutral-tertiary bg-neutral-quaternary/40 flex items-center justify-between">
                <button
                  onClick={() => setNoteModalVisit(null)}
                  className="px-4 py-2 text-xs font-bold text-grey-5 hover:text-dark-1 hover:bg-neutral-tertiary rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingNote}
                  onClick={handleSaveNote}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-primary-base hover:bg-primary-base/90 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Note...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}






      {/* View Submission Details Modal */}
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

              <div className="p-4 bg-neutral-quaternary/40 border-t border-neutral-tertiary flex items-end justify-end gap-3">
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

