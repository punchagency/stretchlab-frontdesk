import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getIntakeInsights,
  InsightAlert,
  InsightWeek,
  IntakeInsightsData,
} from "../../service/home";
import { FilterDropdown, FilterOption } from "./FilterDropdown";
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  X,
  Flame,
  CheckCircle2,
  Building2,
  BarChart3,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─────────────────────────────────── helpers ──────────────────────────────── */

const formatDate = (iso: string) => {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatWeekRange = (startStr: string, endStr: string) => {
  try {
    const sParts = startStr.split("-");
    const eParts = endStr.split("-");
    if (sParts.length === 3 && eParts.length === 3) {
      const sDate = new Date(
        parseInt(sParts[0], 10),
        parseInt(sParts[1], 10) - 1,
        parseInt(sParts[2], 10)
      );
      const eDate = new Date(
        parseInt(eParts[0], 10),
        parseInt(eParts[1], 10) - 1,
        parseInt(eParts[2], 10)
      );

      const sMonth = sDate.toLocaleString("en-US", { month: "short" });
      const eMonth = eDate.toLocaleString("en-US", { month: "short" });
      const year = eDate.getFullYear();

      if (sMonth === eMonth) {
        return `${sMonth} ${sDate.getDate()} – ${eDate.getDate()}, ${year}`;
      } else {
        return `${sMonth} ${sDate.getDate()} – ${eMonth} ${eDate.getDate()}, ${year}`;
      }
    }
  } catch {
    return `${startStr} to ${endStr}`;
  }
  return `${startStr} to ${endStr}`;
};

const pct = (n: number | null | undefined) =>
  n !== null && n !== undefined ? `${n.toFixed(1)}%` : "N/A";

/* ─────────────────────────────────── tooltip ──────────────────────────────── */

const Tooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}> = ({ content, children, maxWidth = 320 }) => {
  return (
    <TooltipProvider delayDuration={100}>
      <RadixTooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="!z-[100005] max-w-xs text-center text-[11px] leading-relaxed font-medium bg-dark-1 text-white px-3 py-2 rounded-xl shadow-xl whitespace-normal"
          style={{ maxWidth }}
        >
          {content}
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  );
};


/* ──────────────────────────── status badge ──────────────────────────── */

const WeekStatusBadge: React.FC<{ week: InsightWeek }> = ({ week }) => {
  const currentRateStr = pct(week.rate);
  const baselineRateStr =
    week.baseline?.rate !== null && week.baseline?.rate !== undefined
      ? pct(week.baseline.rate)
      : null;

  if (week.below_baseline) {
    const message = baselineRateStr
      ? `Form rate (${currentRateStr}) dropped significantly below the 4-week baseline (${baselineRateStr}). Attention needed.`
      : "Form rate dropped noticeably below the studio baseline. Attention needed.";

    return (
      <Tooltip content={message}>
        <span className="inline-flex items-center gap-1 text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 cursor-help">
          <TrendingDown className="w-3.5 h-3.5" /> Below
        </span>
      </Tooltip>
    );
  }

  if (
    week.rate !== null &&
    week.baseline?.rate !== undefined &&
    week.baseline?.rate !== null &&
    week.rate >= week.baseline.rate
  ) {
    const message = baselineRateStr
      ? `Form rate (${currentRateStr}) meets or exceeds the 4-week baseline (${baselineRateStr}). Great performance!`
      : "Form rate meets or exceeds the studio baseline.";

    return (
      <Tooltip content={message}>
        <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 cursor-help">
          <TrendingUp className="w-3.5 h-3.5" /> On Target
        </span>
      </Tooltip>
    );
  }

  if (!week.baseline) {
    return (
      <Tooltip content="Fewer than 8 first visits in the prior 4 weeks — not enough visit history to establish a reliable baseline.">
        <span className="text-grey-2 font-semibold cursor-help border-b border-dashed border-grey-3">
          No History
        </span>
      </Tooltip>
    );
  }

  const normalMessage = baselineRateStr
    ? `Form rate (${currentRateStr}) is within normal weekly expected range of the baseline (${baselineRateStr}).`
    : "Form rate is within normal expected weekly variation.";

  return (
    <Tooltip content={normalMessage}>
      <span className="text-grey-2 font-semibold cursor-help border-b border-dashed border-grey-3">
        Normal
      </span>
    </Tooltip>
  );
};

/* ────────────────────── weekly table (reusable) ────────────────────── */

const WeeksTable: React.FC<{
  weeks: InsightWeek[];
  compact?: boolean;
}> = ({ weeks, compact = false }) => {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-neutral-tertiary shadow-2xs ${compact ? "text-[11px]" : "text-xs"}`}>
      <table className="w-full text-left text-grey-5">
        <thead className="bg-neutral-quaternary/60 text-grey-2 font-bold uppercase tracking-wider border-b border-neutral-tertiary">
          <tr>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"}`}>Week</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>1st Visits</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>With Form</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>Forms Submitted</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>Rate</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>Baseline</th>
            <th className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-tertiary bg-white">
          {weeks.map((week, idx) => (
            <tr
              key={idx}
              className={`hover:bg-neutral-quaternary/40 transition-colors font-semibold ${idx % 2 === 1 ? "bg-neutral-quaternary/20" : ""
                }`}
            >
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} font-bold text-dark-1 whitespace-nowrap`}>
                {formatWeekRange(week.week_start, week.week_end)}
                {!week.complete && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    In progress
                  </span>
                )}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center font-bold text-dark-1`}>
                {week.first_visits}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center text-emerald-700 font-bold`}>
                {week.with_form}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center text-grey-2`}>
                {week.forms_submitted !== week.with_form ? (
                  <Tooltip
                    content={`${week.forms_submitted} form${week.forms_submitted !== 1 ? "s" : ""} submitted, but only ${week.with_form} matched to a first visit by client ID.`}
                  >
                    <span className="cursor-help border-b border-dashed border-grey-5">
                      {week.forms_submitted}
                    </span>
                  </Tooltip>
                ) : (
                  <span>{week.forms_submitted}</span>
                )}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center font-black text-dark-1`}>
                {pct(week.rate)}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center text-grey-2`}>
                {week.baseline?.rate !== null && week.baseline?.rate !== undefined ? (
                  <Tooltip
                    content={`Prior 4-week pooled baseline: ${pct(week.baseline.rate)} (${week.baseline.with_form} of ${week.baseline.first_visits} first visits with form).`}
                  >
                    <span className="cursor-help border-b border-dashed border-grey-3 text-dark-1 font-semibold">
                      {pct(week.baseline.rate)}
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip content="Fewer than 8 first visits in the prior 4 weeks — not enough visit history to establish a reliable baseline.">
                    <span className="cursor-help border-b border-dashed border-grey-3 text-grey-2">
                      No history
                    </span>
                  </Tooltip>
                )}
              </td>
              <td className={`${compact ? "py-2 px-3" : "py-3 px-4"} text-center`}>
                <WeekStatusBadge week={week} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ────────────────────── expandable location card ────────────────────── */

const LocationCard: React.FC<{
  loc: IntakeInsightsData["locations"][0];
}> = ({ loc }) => {
  const [expanded, setExpanded] = useState(false);
  const streak = loc.streak;
  const isRobotActive = loc.robot_selected !== false;
  const baseRateStr =
    streak.baseline && streak.baseline.rate !== null
      ? `${streak.baseline.rate.toFixed(1)}%`
      : null;

  // Count total missing days across all weeks
  const totalMissing = loc.weeks.reduce(
    (sum, w) => sum + (w.missing_days?.length || 0),
    0
  );

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${!isRobotActive
        ? "bg-zinc-50 border-zinc-200 opacity-70"
        : "border-neutral-tertiary bg-white"
        }`}
    >
      {/* Card header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start justify-between text-left hover:bg-neutral-quaternary/30 transition-colors cursor-pointer group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-bold text-dark-1 text-sm">
            <Building2 className="w-4 h-4 text-[#368591] shrink-0" />
            <span className="truncate">{loc.location_name}</span>
            {!isRobotActive && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-zinc-200 text-zinc-600 rounded-md">
                <EyeOff className="w-2.5 h-2.5" /> Not Monitored
              </span>
            )}
            {isRobotActive && loc.robot_selected === true && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                <Eye className="w-2.5 h-2.5" /> Active
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-grey-5 space-y-1.5 font-semibold">
            {/* Streak info */}
            <div>
              {streak.length === 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Latest visit had an
                  intake form
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    Consecutive visits without form:{" "}
                    <span className="font-black text-rose-600">
                      {streak.open_ended
                        ? `${streak.length}+`
                        : streak.length}
                    </span>
                  </span>
                </span>
              )}
            </div>



            {/* Data quality */}
            {totalMissing > 0 && (
              <div className="text-[10px] text-amber-700 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {totalMissing} day{totalMissing > 1 ? "s" : ""} with missing data across reported weeks
              </div>
            )}
          </div>
        </div>

        {/* Right side: badges + expand chevron */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {streak.unusual && (
            <Tooltip content={`At this location's baseline form rate of ${baseRateStr || "N/A"}, a streak of ${streak.length} consecutive visits without a form would happen less than 5% of the time.`}>
              <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 rounded-lg cursor-help">
                Unusual
              </span>
            </Tooltip>
          )}
          <div className="text-grey-2 group-hover:text-dark-1 transition-colors">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable weekly breakdown */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-neutral-tertiary bg-neutral-quaternary/20">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-grey-2 mb-2">
            Weekly Breakdown — {loc.location_name}
          </h4>
          <WeeksTable weeks={loc.weeks} compact />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */

/* ═══════════════════ SHARED CONTENT (used by both panel + modal) ═══════════════════ */

const renderAlert = (alert: InsightAlert, index: number) => {
  if (alert.kind === "below_baseline") {
    const locName = alert.location_name || "The Studio";
    const rateStr = pct(alert.rate);
    const baselineStr = pct(alert.baseline_rate);
    return (
      <div
        key={index}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs"
      >
        <TrendingDown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold">{locName}:</span> Intake form
          completion rate dropped to{" "}
          <span className="font-extrabold text-amber-950">{rateStr}</span> of
          first visits this week (baseline:{" "}
          <span className="font-semibold">{baselineStr}</span>).
          {alert.p_value !== null && (
            <span className="text-[10px] text-amber-700 ml-1">
              (p = {alert.p_value.toFixed(4)})
            </span>
          )}
          {alert.complete ? "" : " (Week in progress)"}
        </div>
      </div>
    );
  }

  if (alert.kind === "no_form_streak") {
    const locName = alert.location_name || "Studio";
    return (
      <div
        key={index}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs"
      >
        <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold">{locName}:</span>{" "}
          <span className="font-black text-rose-950">{alert.length}</span>{" "}
          first-time clients in a row without an intake form (since{" "}
          {formatDate(alert.since)}).
          {alert.probability !== null && (
            <span className="text-[10px] text-rose-700 ml-1">
              ({(alert.probability * 100).toFixed(1)}% chance at baseline)
            </span>
          )}
        </div>
      </div>
    );
  }

  if (alert.kind === "missing_data") {
    const locName = alert.location_name || "the studio";
    const daysStr = alert.days.map((d) => formatDate(d)).join(", ");
    return (
      <div
        key={index}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs"
      >
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          No first-visit data for{" "}
          <span className="font-bold">{locName}</span> on {daysStr}. Numbers
          for those days are incomplete.
        </div>
      </div>
    );
  }

  return null;
};

const InsightsBody: React.FC<{
  insightsData: IntakeInsightsData;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}> = ({ insightsData, isLoading, isError, refetch }) => {
  const weeksList = insightsData?.totals?.weeks || [];

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-grey-5 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#368591]" />
        <p className="text-xs font-extrabold uppercase tracking-wider text-dark-1">
          Loading Intake Insights...
        </p>
      </div>
    );
  }

  if (isError || !insightsData) {
    return (
      <div className="py-12 text-center text-rose-600 space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto" />
        <p className="font-bold text-sm">Failed to load intake insights.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-bold text-white bg-[#368591] rounded-xl hover:bg-[#2c6d77] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Active Alerts ── */}
      {insightsData.alerts && insightsData.alerts.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-grey-2">
            Active Studio Alerts ({insightsData.alerts.length})
          </h3>
          <div className="space-y-2">
            {insightsData.alerts.map((alert, idx) =>
              renderAlert(alert, idx)
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>All clear!</strong> Intake form conversion rates are
            meeting studio baselines across all active locations.
          </span>
        </div>
      )}

      {/* ── Weekly Trends Table ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-grey-2">
            Weekly Intake Form Performance
          </h3>
          <Tooltip content="Each week's form rate is compared against the 4-week baseline. 'Below' indicates completion dropped noticeably below normal studio baseline.">
            <Info className="w-3.5 h-3.5 text-grey-5 cursor-help" />
          </Tooltip>
        </div>
        <WeeksTable weeks={weeksList} />
      </div>

      {/* ── Location Streaks & Breakdown ── */}
      {insightsData.locations &&
        insightsData.locations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-grey-2">
                Location Streaks & Weekly Breakdown
              </h3>
              <Tooltip content="Each location's current streak of first visits without an intake form. An 'Unusual' streak would happen less than 5% of the time at the location's own baseline rate. Click a card to see weekly details.">
                <Info className="w-3.5 h-3.5 text-grey-5 cursor-help" />
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {insightsData.locations.map((loc) => (
                <LocationCard key={loc.location_id} loc={loc} />
              ))}
            </div>
          </div>
        )}
    </>
  );
};

/* ═══════════════════ INLINE TAB PANEL ═══════════════════ */

interface IntakeInsightsPanelProps {
  selectedLocationId?: string;
}

const WEEKS_OPTIONS: FilterOption[] = [
  { value: "4", label: "Last 4 weeks" },
  { value: "8", label: "Last 8 weeks" },
  { value: "12", label: "Last 12 weeks" },
  { value: "16", label: "Last 16 weeks" },
];

export const IntakeInsightsPanel: React.FC<IntakeInsightsPanelProps> = ({
  selectedLocationId,
}) => {
  const [weeksCount, setWeeksCount] = useState<number>(8);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>(
    selectedLocationId || ""
  );

  const {
    data: insightsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<IntakeInsightsData>({
    queryKey: ["frontdesk-insights", weeksCount, activeLocationFilter],
    queryFn: async () => {
      const res = await getIntakeInsights(
        weeksCount,
        activeLocationFilter || undefined
      );
      return res.data;
    },
  });

  const locationOptions: FilterOption[] = [
    { value: "", label: "All Studio Locations" },
    ...(insightsData?.locations || []).map((loc) => ({
      value: loc.location_id,
      label: loc.location_name,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* ── Inline Header Bar ── */}
      <div className="bg-white rounded-2xl border border-neutral-tertiary p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#368591]/10 rounded-2xl text-[#368591] border border-[#368591]/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-dark-1 tracking-tight">
                Intake Insights
              </h2>
              <p className="text-xs text-grey-5 font-medium">
                {insightsData?.as_of ? (
                  <>
                    Data through{" "}
                    <span className="font-bold text-dark-1">
                      {formatDate(insightsData.as_of)}
                    </span>
                    {" · "}Weekly completion rates, baselines & streak alerts
                  </>
                ) : (
                  "Weekly intake completion rates, studio baselines, and alerts"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Location Selector */}
            {insightsData?.locations && insightsData.locations.length > 0 && (
              <FilterDropdown
                value={activeLocationFilter}
                options={locationOptions}
                onChange={(val) => setActiveLocationFilter(val)}
                showLabel={false}
                showSearch={true}
                placeholder="All Studio Locations"
                className="w-48 sm:w-56"
              />
            )}

            {/* Weeks Window Selector */}
            <FilterDropdown
              value={String(weeksCount)}
              options={WEEKS_OPTIONS}
              onChange={(val) => setWeeksCount(Number(val))}
              showLabel={false}
              disableSort={true}
              className="w-36 sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* ── Insights Content ── */}
      <InsightsBody
        insightsData={insightsData!}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
    </div>
  );
};

/* ═══════════════════ MODAL WRAPPER (kept for backward compat) ═══════════════════ */

interface IntakeInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocationId?: string;
}

export const IntakeInsightsModal: React.FC<IntakeInsightsModalProps> = ({
  isOpen,
  onClose,
  selectedLocationId,
}) => {
  const [weeksCount, setWeeksCount] = useState<number>(8);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>(
    selectedLocationId || ""
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    data: insightsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<IntakeInsightsData>({
    queryKey: ["frontdesk-insights", weeksCount, activeLocationFilter],
    queryFn: async () => {
      const res = await getIntakeInsights(
        weeksCount,
        activeLocationFilter || undefined
      );
      return res.data;
    },
    enabled: isOpen,
  });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const locationOptions: FilterOption[] = [
    { value: "", label: "All Studio Locations" },
    ...(insightsData?.locations || []).map((loc) => ({
      value: loc.location_id,
      label: loc.location_name,
    })),
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-neutral-tertiary overflow-hidden flex flex-col max-h-[92vh]">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-neutral-tertiary bg-neutral-quaternary/40 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#368591]/10 rounded-2xl text-[#368591] border border-[#368591]/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-dark-1 tracking-tight">
                Frontdesk Intake Insights
              </h2>
              <p className="text-xs text-grey-5 font-medium">
                {insightsData?.as_of ? (
                  <>
                    Data through{" "}
                    <span className="font-bold text-dark-1">
                      {formatDate(insightsData.as_of)}
                    </span>
                    {" · "}Weekly intake completion rates, baselines & alerts
                  </>
                ) : (
                  "Weekly intake completion rates, studio baselines, and alerts"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Location Selector */}
            {insightsData?.locations && insightsData.locations.length > 0 && (
              <FilterDropdown
                value={activeLocationFilter}
                options={locationOptions}
                onChange={(val) => setActiveLocationFilter(val)}
                showLabel={false}
                showSearch={true}
                placeholder="All Studio Locations"
                className="w-48 sm:w-56"
              />
            )}

            {/* Weeks Window Selector */}
            <FilterDropdown
              value={String(weeksCount)}
              options={WEEKS_OPTIONS}
              onChange={(val) => setWeeksCount(Number(val))}
              showLabel={false}
              disableSort={true}
              className="w-36 sm:w-40"
            />

            <button
              onClick={onClose}
              className="p-1.5 text-grey-2 hover:text-dark-1 rounded-xl hover:bg-neutral-tertiary transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════════════════ BODY ═══════════════════ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <InsightsBody
            insightsData={insightsData!}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
          />
        </div>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <div className="px-6 py-3.5 border-t border-neutral-tertiary bg-neutral-quaternary/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-extrabold text-dark-1 bg-white hover:bg-neutral-tertiary/60 border border-neutral-tertiary rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

