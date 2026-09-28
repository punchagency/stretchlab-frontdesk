import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Users,
  Target,
  FileText,
  ChevronDown,
  X,
  CalendarDays,
  Sparkles,
  ListFilter,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import {
  getClientActions,
  localDay,
  visitOfAction,
  actionRowKey,
  ClientActionRow,
  ActionBadge,
  Goal,
  ClientActionsResponse,
} from "../../service/clientActions";
import {
  checkFollowUp,
  uncheckFollowUp,
  StudioLocation,
  FollowUp,
} from "../../service/home";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";
import { ClientGoalModal } from "./ClientGoalModal";
import { KpiSummaryCard } from "./KpiSummaryCard";
import { FollowUpNoteModal } from "./FollowUpNoteModal";
import { ClientArrivalTimeline } from "./ClientArrivalTimeline";
import { ClientActionGridCard } from "./ClientArrivalCard";
import { ClientActionsPagination } from "./ClientActionsPagination";

interface ClientActionsTabProps {
  locations?: StudioLocation[];
  initialLocationId?: string;
}

type BadgeFilterType =
  | "all"
  | "first_visit"
  | "intake_form_missing"
  | "maps_due"
  | "future_bookings_below_target"
  | "goal_missing"
  | "goal_update_due"
  | "goal_template"
  | "goal_all"
  | "no_actions";

export const ClientActionsTab: React.FC<ClientActionsTabProps> = ({
  locations = [],
  initialLocationId = "",
}) => {
  const queryClient = useQueryClient();

  // Date and filter states
  const todayStr = useMemo(() => localDay(), []);
  const tomorrowStr = useMemo(
    () => localDay(new Date(Date.now() + 86400000)),
    []
  );

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLocation, setSelectedLocation] =
    useState<string>(initialLocationId);
  const [search, setSearch] = useState<string>("");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilterType>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");

  // Modals state
  const [goalModalState, setGoalModalState] = useState<{
    isOpen: boolean;
    clubreadyUserId: string | null;
    clientName: string | null;
    locationId?: string;
    goal: Goal | null;
  }>({
    isOpen: false,
    clubreadyUserId: null,
    clientName: null,
    goal: null,
  });

  const [noteModalVisit, setNoteModalVisit] = useState<{
    row: ClientActionRow;
    noteText: string;
  } | null>(null);

  // Loading and clipboard states
  const [togglingRowKey, setTogglingRowKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Main Data Query
  const {
    data: clientActionsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "frontdesk-client-actions",
      selectedDate,
      selectedLocation || undefined,
    ],
    queryFn: () =>
      getClientActions(selectedDate, selectedLocation || undefined),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const actionsData = clientActionsResponse?.data;
  const windowData = actionsData?.window;
  const summary = actionsData?.summary;
  const bookings = useMemo(() => actionsData?.bookings || [], [actionsData]);

  // Minimum allowed date based on backend window.today or local today
  const minAllowedDate = windowData?.today || todayStr;

  // Search and Filter logic
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (badgeFilter !== "all") {
      if (badgeFilter === "first_visit") {
        result = result.filter((b) => b.first_visit === true);
      } else if (badgeFilter === "goal_all") {
        result = result.filter(
          (b) =>
            b.badges.includes("goal_missing") ||
            b.badges.includes("goal_update_due") ||
            b.badges.includes("goal_template")
        );
      } else if (badgeFilter === "no_actions") {
        result = result.filter((b) => b.badges.length === 0);
      } else {
        result = result.filter((b) =>
          b.badges.includes(badgeFilter as ActionBadge)
        );
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((b) => {
        const name = (b.client_name || "").toLowerCase();
        const flex = (b.booking_with || "").toLowerCase();
        const detail = (b.booking_detail || "").toLowerCase();
        const crId = (b.clubready_user_id || "").toLowerCase();
        const bkId = (b.booking_id || "").toLowerCase();
        return (
          name.includes(q) ||
          flex.includes(q) ||
          detail.includes(q) ||
          crId.includes(q) ||
          bkId.includes(q)
        );
      });
    }

    return result;
  }, [bookings, badgeFilter, search]);

  // Action Cards Pagination state
  const [cardsPage, setCardsPage] = useState<number>(1);
  const [cardsPageSize, setCardsPageSize] = useState<number>(12); // 12 cards per page (3 cols x 4 rows)

  // Total pages and paginated slice for cards grid
  const totalCardsPages =
    cardsPageSize === 0
      ? 1
      : Math.max(1, Math.ceil(filteredBookings.length / (cardsPageSize || 1)));

  const validCardsPage = Math.min(Math.max(1, cardsPage), totalCardsPages);

  const paginatedCards = useMemo(() => {
    if (cardsPageSize === 0 || cardsPageSize >= filteredBookings.length) {
      return filteredBookings;
    }
    const start = (validCardsPage - 1) * cardsPageSize;
    return filteredBookings.slice(start, start + cardsPageSize);
  }, [filteredBookings, validCardsPage, cardsPageSize]);

  const handleBadgeFilterChange = (filter: BadgeFilterType) => {
    setBadgeFilter(filter);
    setCardsPage(1);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Follow-up Check/Uncheck Mutation with Instant Optimistic UI Updates
  const toggleFollowUpMutation = useMutation({
    mutationFn: async ({
      row,
      note,
      uncheck,
    }: {
      row: ClientActionRow;
      note?: string;
      uncheck?: boolean;
    }) => {
      const visit = visitOfAction(row);
      if (!visit)
        throw new Error("Missing first-visit information to follow up");
      if (uncheck) {
        return uncheckFollowUp(visit);
      }
      return checkFollowUp(visit, note);
    },
    onMutate: async ({ row, note, uncheck }) => {
      const actionsQueryKey = [
        "frontdesk-client-actions",
        selectedDate,
        selectedLocation || undefined,
      ];
      await queryClient.cancelQueries({ queryKey: actionsQueryKey });
      const previousData =
        queryClient.getQueryData<ClientActionsResponse>(actionsQueryKey);

      if (previousData) {
        const updatedBookings = previousData.data.bookings.map((b) => {
          if (
            b.clubready_user_id === row.clubready_user_id &&
            b.intake?.location_id === row.intake?.location_id
          ) {
            const newFollowUp: FollowUp | null = uncheck
              ? null
              : {
                checked: true,
                checked_at: new Date().toISOString(),
                checked_by: null,
                checked_by_name: "You",
                note:
                  note !== undefined
                    ? note
                    : b.intake?.follow_up?.note || null,
              };
            return {
              ...b,
              intake: b.intake ? { ...b.intake, follow_up: newFollowUp } : null,
            };
          }
          return b;
        });

        const updatedFollowedUpCount = updatedBookings.filter(
          (b) => b.intake?.follow_up?.checked
        ).length;

        queryClient.setQueryData<ClientActionsResponse>(actionsQueryKey, {
          ...previousData,
          data: {
            ...previousData.data,
            bookings: updatedBookings,
            summary: {
              ...previousData.data.summary,
              intake_followed_up: updatedFollowedUpCount,
            },
          },
        });

        // Keep local drawer state in sync if modal is open for this row
        if (
          noteModalVisit &&
          noteModalVisit.row.clubready_user_id === row.clubready_user_id
        ) {
          const updatedRow = updatedBookings.find(
            (b) => b.clubready_user_id === row.clubready_user_id
          );
          if (updatedRow) {
            setNoteModalVisit((prev) =>
              prev ? { ...prev, row: updatedRow } : null
            );
          }
        }
      }

      return { previousData, actionsQueryKey };
    },
    onSuccess: (_data, variables) => {
      if (variables.uncheck) {
        renderSuccessToast(
          variables.row.client_name
            ? `Follow-up removed for ${variables.row.client_name}`
            : "Follow-up removed successfully"
        );
      } else if (variables.note !== undefined) {
        renderSuccessToast("Follow-up note saved successfully");
      } else {
        renderSuccessToast(
          variables.row.client_name
            ? `Follow-up completed for ${variables.row.client_name}`
            : "Follow-up completed successfully"
        );
      }
      setNoteModalVisit(null);
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousData && context?.actionsQueryKey) {
        queryClient.setQueryData(
          context.actionsQueryKey,
          context.previousData
        );
      }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update follow-up status.";
      renderErrorToast(msg);
    },
    onSettled: () => {
      setTogglingRowKey(null);
      queryClient.invalidateQueries({
        queryKey: ["frontdesk-client-actions"],
      });
      queryClient.invalidateQueries({ queryKey: ["frontdesk-home"] });
    },
  });

  const handleToggleRowFollowUp = (row: ClientActionRow) => {
    if (!row.intake || !row.clubready_user_id) return;
    const isChecked = Boolean(row.intake.follow_up?.checked);
    const key = actionRowKey(row, 0);
    setTogglingRowKey(key);

    toggleFollowUpMutation.mutate({ row, uncheck: isChecked });
  };

  const formatUtcDateTime = (stamp?: string | null) => {
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

  const handleOpenGoalModal = (row: ClientActionRow) => {
    setGoalModalState({
      isOpen: true,
      clubreadyUserId: row.clubready_user_id,
      clientName: row.client_name,
      locationId: row.intake?.location_id,
      goal: row.goal,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar: Date, Location, and Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-tertiary shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Date Selector */}
          <div className="md:col-span-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-neutral-quaternary rounded-xl border border-neutral-tertiary">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setCardsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedDate === todayStr
                  ? "bg-white text-primary-base shadow-2xs"
                  : "text-grey-5 hover:text-dark-1"
                  }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(tomorrowStr);
                  setCardsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedDate === tomorrowStr
                  ? "bg-white text-primary-base shadow-2xs"
                  : "text-grey-5 hover:text-dark-1"
                  }`}
              >
                Tomorrow
              </button>
            </div>

            <div className="relative flex-1 min-w-[150px]">
              <Calendar className="w-3.5 h-3.5 text-grey-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                min={minAllowedDate}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setCardsPage(1);
                  }
                }}
                className="w-full pl-8 pr-3 py-2 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-bold text-dark-1 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Location Selector */}
          <div className="md:col-span-3">
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-grey-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCardsPage(1);
                }}
                className="w-full pl-8 pr-8 py-2 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-bold text-dark-1 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 appearance-none transition-all cursor-pointer truncate"
              >
                <option value="">All Studio Locations</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-grey-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search bar */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-grey-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search client, flexologist, session, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCardsPage(1);
                }}
                className="w-full pl-8 pr-8 py-2 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCardsPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-grey-5 hover:text-dark-1 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Interactive Metrics Cards - 4 cards per row on large screen, all identical size */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSummaryCard
            title="Bookings"
            count={summary.bookings}
            subText={`(${summary.clients} clients)`}
            icon={Users}
            tone="default"
            isActive={badgeFilter === "all"}
            onClick={() => handleBadgeFilterChange("all")}
          />

          <KpiSummaryCard
            title="First Visits"
            count={summary.first_visits}
            icon={Sparkles}
            tone="primary"
            isActive={badgeFilter === "first_visit"}
            onClick={() => handleBadgeFilterChange("first_visit")}
          />

          <KpiSummaryCard
            title="Intake Missing"
            count={summary.intake_form_missing}
            subText={`(${summary.intake_followed_up} reminded)`}
            icon={FileText}
            tone="rose"
            isActive={badgeFilter === "intake_form_missing"}
            onClick={() => handleBadgeFilterChange("intake_form_missing")}
          />

          <KpiSummaryCard
            title="MAPS Due"
            count={summary.maps_due}
            icon={Target}
            tone="slate"
            isActive={badgeFilter === "maps_due"}
            onClick={() => handleBadgeFilterChange("maps_due")}
          />

          <KpiSummaryCard
            title="Book Ahead"
            count={summary.future_bookings_below_target}
            // subText={
            //   summary.booking_guidance
            //     ? `(${summary.booking_guidance.high} high / ${summary.booking_guidance.medium} med)`
            //     : undefined
            // }

            icon={CalendarDays}
            tone="indigo"
            isActive={badgeFilter === "future_bookings_below_target"}
            onClick={() => handleBadgeFilterChange("future_bookings_below_target")}
          />

          <KpiSummaryCard
            title="Goals Need Action"
            count={
              summary.goal_missing +
              (summary.goal_update_due || 0) +
              (summary.goal_template || 0)
            }
            subText={`(${summary.goal_missing} miss / ${summary.goal_update_due || 0} due${summary.goal_template ? ` / ${summary.goal_template} tmpl` : ""
              })`}
            icon={Sparkles}
            tone="purple"
            isActive={
              badgeFilter === "goal_all" ||
              badgeFilter === "goal_missing" ||
              badgeFilter === "goal_update_due" ||
              badgeFilter === "goal_template"
            }
            onClick={() => handleBadgeFilterChange("goal_all")}
          />
        </div>
      )}

      {/* Active Filter Bar & Segmented Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-grey-5 mr-1 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("all")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "all"
              ? "bg-primary-base text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-grey-5 border border-neutral-tertiary"
              }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("intake_form_missing")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "intake_form_missing"
              ? "bg-rose-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-rose-700 border border-neutral-tertiary"
              }`}
          >
            Intake Missing
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("maps_due")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "maps_due"
              ? "bg-slate-700 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-slate-700 border border-neutral-tertiary"
              }`}
          >
            MAPS Due
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("future_bookings_below_target")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "future_bookings_below_target"
              ? "bg-indigo-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-indigo-700 border border-neutral-tertiary"
              }`}
          >
            Book Ahead
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("goal_missing")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "goal_missing"
              ? "bg-purple-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-purple-700 border border-neutral-tertiary"
              }`}
          >
            Goal Missing
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("goal_update_due")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "goal_update_due"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-amber-800 border border-neutral-tertiary"
              }`}
          >
            Goal Due (90d+)
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("goal_template")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "goal_template"
              ? "bg-orange-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-orange-800 border border-neutral-tertiary"
              }`}
          >
            Template Goal{summary?.goal_template ? ` (${summary.goal_template})` : ""}
          </button>
          <button
            type="button"
            onClick={() => handleBadgeFilterChange("no_actions")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${badgeFilter === "no_actions"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-white hover:bg-neutral-quaternary text-emerald-700 border border-neutral-tertiary"
              }`}
          >
            All Clear
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Clear active filter tag if filtered */}
          {(badgeFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setBadgeFilter("all");
                setSearch("");
              }}
              className="text-xs font-bold text-primary-base hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Active Filters</span>
            </button>
          )}

          {/* View Mode Toggle: Arrival Timeline vs Action Cards */}
          <div className="inline-flex p-1 bg-neutral-quaternary rounded-xl border border-neutral-tertiary">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "timeline"
                ? "bg-white text-primary-base shadow-2xs font-black"
                : "text-grey-5 hover:text-dark-1"
                }`}
              title="Arrival Timeline View"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Arrival Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "cards"
                ? "bg-white text-primary-base shadow-2xs font-black"
                : "text-grey-5 hover:text-dark-1"
                }`}
              title="Action Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Chronological Arrival Timeline OR Action Cards Grid */}
      {isError ? (
        <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-xs p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-dark-1">
            Failed to Load Client Actions
          </h4>
          <p className="text-xs text-grey-5 max-w-md mx-auto">
            {(error as any)?.response?.data?.message ||
              "Unable to fetch client action bookings for this date."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-base text-white text-xs font-black rounded-xl hover:bg-primary-base/90 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-3xl border border-neutral-tertiary shadow-xs p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-base mx-auto" />
          <p className="text-xs font-bold text-grey-5">
            Loading today's client arrivals & critical actions...
          </p>
        </div>
      ) : viewMode === "timeline" ? (
        <ClientArrivalTimeline
          bookings={filteredBookings}
          selectedDate={selectedDate}
          todayStr={todayStr}
          onGoalClick={handleOpenGoalModal}
          onToggleFollowUp={handleToggleRowFollowUp}
          onOpenNoteDrawer={(r) =>
            setNoteModalVisit({
              row: r,
              noteText: r.intake?.follow_up?.note || "",
            })
          }
          togglingRowKey={togglingRowKey}
          copiedId={copiedId}
          onCopyId={handleCopyId}
          formatUtcDateTime={formatUtcDateTime}
          onClearFilters={() => {
            setBadgeFilter("all");
            setSearch("");
            setCardsPage(1);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-grey-5 px-1">
            <span>
              Showing <strong className="text-dark-1">{filteredBookings.length}</strong> client
              {filteredBookings.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-tertiary shadow-xs space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-neutral-quaternary flex items-center justify-center text-grey-2 border border-neutral-tertiary">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-dark-1">
                  No Client Records Found
                </h3>
                <p className="text-xs text-grey-5 max-w-md mx-auto mt-1">
                  No appointments match your active filter or search for this date.
                </p>
              </div>
              {(badgeFilter !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setBadgeFilter("all");
                    setSearch("");
                    setCardsPage(1);
                  }}
                  className="px-4 py-2 text-xs font-black text-primary-base bg-primary-base/10 hover:bg-primary-base/20 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedCards.map((booking, idx) => (
                  <ClientActionGridCard
                    key={actionRowKey(booking, idx)}
                    row={booking}
                    onGoalClick={handleOpenGoalModal}
                    onToggleFollowUp={handleToggleRowFollowUp}
                    onOpenNoteDrawer={(r) =>
                      setNoteModalVisit({
                        row: r,
                        noteText: r.intake?.follow_up?.note || "",
                      })
                    }
                    isToggling={
                      togglingRowKey ===
                      (booking.clubready_user_id || booking.booking_id)
                    }
                    copiedId={copiedId}
                    onCopyId={handleCopyId}
                    formatUtcDateTime={formatUtcDateTime}
                  />
                ))}
              </div>

              {/* Action Cards Grid Pagination */}
              {filteredBookings.length > 9 && (
                <ClientActionsPagination
                  currentPage={validCardsPage}
                  totalPages={totalCardsPages}
                  totalItems={filteredBookings.length}
                  pageSize={cardsPageSize}
                  pageSizeOptions={[
                    { label: "9 / page", value: 9 },
                    { label: "12 / page", value: 12 },
                    { label: "18 / page", value: 18 },
                    { label: "24 / page", value: 24 },
                    { label: "All clients", value: 0 },
                  ]}
                  itemLabel="clients"
                  onPageChange={(p) => setCardsPage(p)}
                  onPageSizeChange={(sz) => {
                    setCardsPageSize(sz);
                    setCardsPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Reusable Goal Modal */}
      <ClientGoalModal
        isOpen={goalModalState.isOpen}
        onClose={() =>
          setGoalModalState((prev) => ({ ...prev, isOpen: false }))
        }
        clubreadyUserId={goalModalState.clubreadyUserId}
        clientName={goalModalState.clientName}
        locationId={goalModalState.locationId}
        initialGoal={goalModalState.goal}
        locations={locations}
      />

      {/* Reusable Follow-up Note Slide-over Drawer */}
      <FollowUpNoteModal
        isOpen={Boolean(noteModalVisit)}
        onClose={() => setNoteModalVisit(null)}
        clientName={noteModalVisit?.row.client_name}
        clubreadyUserId={noteModalVisit?.row.clubready_user_id}
        bookingDate={noteModalVisit?.row.booking_date}
        bookingTime={
          noteModalVisit?.row.booking_start
            ? `${noteModalVisit.row.booking_start}${noteModalVisit.row.booking_end ? ` - ${noteModalVisit.row.booking_end}` : ""
            }`
            : undefined
        }
        locationName={noteModalVisit?.row.location_name}
        locationId={noteModalVisit?.row.intake?.location_id}
        intakeReceived={Boolean(noteModalVisit?.row.intake?.form_received)}
        followUp={noteModalVisit?.row.intake?.follow_up}
        onToggleFollowUp={() => {
          if (noteModalVisit) {
            handleToggleRowFollowUp(noteModalVisit.row);
          }
        }}
        isTogglingFollowUp={Boolean(
          noteModalVisit &&
          togglingRowKey ===
          (noteModalVisit.row.booking_id ??
            `fv:${noteModalVisit.row.clubready_user_id}:${noteModalVisit.row.intake?.location_id ?? ""}`)
        )}
        noteText={noteModalVisit?.noteText || ""}
        onChangeNote={(txt) =>
          setNoteModalVisit((prev) =>
            prev ? { ...prev, noteText: txt } : null
          )
        }
        onSave={() => {
          if (noteModalVisit) {
            toggleFollowUpMutation.mutate({
              row: noteModalVisit.row,
              note: noteModalVisit.noteText.trim(),
              uncheck: false,
            });
          }
        }}
        isSaving={toggleFollowUpMutation.isPending}
      />
    </div>
  );
};
