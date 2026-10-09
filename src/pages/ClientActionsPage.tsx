import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { ClientActionsTab } from "../components/clientActions";
import {
  getFrontdeskHome,
  refreshDay,
  RefreshOutcome,
  RefreshSummary,
} from "../service/home";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

export const ClientActionsPage = () => {
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshBanner, setRefreshBanner] = useState<{
    type: "success" | "warning" | "error";
    title: string;
    description: string;
    outcomes?: RefreshOutcome[];
    summary?: RefreshSummary;
  } | null>(null);

  // Fetch locations from frontdesk home API (lightweight, cached)
  const { data: homeData, isRefetching } = useQuery({
    queryKey: ["frontdesk-home-locations"],
    queryFn: async () => {
      const response = await getFrontdeskHome({ page_size: 1 });
      return response.data?.data;
    },
  });

  const locations = homeData?.locations || [];

  const formatUtcTimestamp = (stamp?: string | null) => {
    if (!stamp) return "";
    try {
      const d = new Date(stamp.endsWith("Z") ? stamp : stamp + "Z");
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return stamp;
    }
  };

  const handleLiveRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshBanner(null);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    try {
      const res = await refreshDay(todayStr);
      if (res.status === "success") {
        const bookingsSummary = res.data.summary.bookings;
        const bookingsText = bookingsSummary
          ? ` • Today's bookings: ${bookingsSummary.made_today || 0} made today, ${bookingsSummary.removed || 0
          } cancelled/moved`
          : "";
        setRefreshBanner({
          type: "success",
          title: "Refresh Completed",
          description: `Successfully refreshed ${res.data.summary.refreshed} location(s) for ${todayStr}.${bookingsText}`,
          outcomes: res.data.locations,
          summary: res.data.summary,
        });
      } else if (res.status === "partial") {
        setRefreshBanner({
          type: "warning",
          title: "Partial Refresh Completed",
          description: `${res.data.summary.refreshed} of ${res.data.summary.locations} location(s) refreshed. Some location data could not be updated right now.`,
          outcomes: res.data.locations,
          summary: res.data.summary,
        });
      } else {
        setRefreshBanner({
          type: "error",
          title: "Refresh Failed",
          description:
            "Could not refresh records from ClubReady at this time. Its list is from this morning. Try again in a minute.",
          outcomes: res.data.locations,
          summary: res.data.summary,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["frontdesk-client-actions"] });
      queryClient.invalidateQueries({ queryKey: ["frontdesk-home"] });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setRefreshBanner({
          type: "warning",
          title: "Refresh Already In Progress",
          description:
            "Someone is already refreshing ClubReady records for this studio. Please try again in a couple of minutes.",
        });
      } else {
        setRefreshBanner({
          type: "error",
          title: "Refresh Request Failed",
          description:
            err.response?.data?.message || err.message || "Failed to trigger live refresh.",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary-base/10 text-primary-base border border-primary-base/20 inline-flex items-center gap-1.5">
              <Target className="w-3 h-3 text-primary-base" />
              Client Actions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
            Client Actions
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-grey-5 mt-1">
            Prioritized arrival timeline and  actions for booked sessions
          </p>
        </div>

        {/* Live Refresh Button & Sync Info */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <div className="flex flex-col sm:items-end gap-1.5">
            <button
              onClick={handleLiveRefresh}
              disabled={isRefreshing || isRefetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#368591] hover:bg-[#2c6d77] text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing ClubReady..." : "Refresh from ClubReady"}
            </button>
            {homeData?.window?.upcoming_as_of && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-grey-5 hover:text-dark-1 transition-colors cursor-help px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Synced: {formatUtcTimestamp(homeData.window.upcoming_as_of)}</span>
                      <Info className="w-3 h-3 text-grey-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="max-w-xs text-xs p-3">
                    <p className="font-extrabold text-white mb-1">ClubReady Sync Schedule</p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Bookings automatically sync nightly and throughout the day. Click "Refresh from ClubReady" to pull latest bookings on demand.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {refreshBanner.outcomes.map((loc, idx) => {
                    const fvSuccess = loc.status === "refreshed";
                    const bkSuccess = loc.bookings?.status === "refreshed";
                    const allGood = fvSuccess && (!loc.bookings || bkSuccess);
                    const allFailed =
                      loc.status === "failed" && (!loc.bookings || loc.bookings.status === "failed");

                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border flex flex-col gap-0.5 shadow-2xs ${allGood
                          ? "bg-white/90 border-emerald-300 text-emerald-950"
                          : allFailed
                            ? "bg-white/90 border-rose-300 text-rose-950"
                            : "bg-white/90 border-amber-300 text-amber-950"
                          }`}
                      >
                        <span className="font-extrabold text-[11.5px]">{loc.location_name}</span>
                        <span className="text-[10px] text-grey-5 font-medium">
                          First Visits: {fvSuccess ? `${loc.first_visits ?? 0} booked` : loc.status}
                          {loc.bookings && (
                            <>
                              {" "}
                              • Bookings:{" "}
                              {bkSuccess
                                ? `${loc.bookings.made_today ?? 0} made today, ${loc.bookings.removed ?? 0
                                } cancelled`
                                : loc.bookings.status}
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
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

      {/* Main Content Component */}
      <ClientActionsTab locations={locations} />
    </div>
  );
};
