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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
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

const formatWeekShort = (startStr: string, endStr: string) => {
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

      if (sMonth === eMonth) {
        return `${sMonth} ${sDate.getDate()}–${eDate.getDate()}`;
      } else {
        return `${sMonth} ${sDate.getDate()}–${eMonth} ${eDate.getDate()}`;
      }
    }
  } catch {
    return startStr;
  }
  return startStr;
};

const pct = (n: number | null | undefined) =>
  n !== null && n !== undefined ? `${n.toFixed(1)}%` : "N/A";

const getFormsSubmittedTooltip = (formsSubmitted: number, withForm: number) => {
  if (withForm > formsSubmitted) {
    return `${withForm} first-time visits this week had an intake form on file (including forms completed in advance prior to this week), while ${formsSubmitted} new form${formsSubmitted !== 1 ? "s were" : " was"} submitted during this week.`;
  }
  if (formsSubmitted > withForm) {
    return `${formsSubmitted} form${formsSubmitted !== 1 ? "s were" : " was"} submitted this week, and ${withForm} matched to this week's first-time visits (remaining forms may belong to repeat clients or upcoming visits in future weeks).`;
  }
  return `All ${formsSubmitted} form${formsSubmitted !== 1 ? "s" : ""} submitted this week matched to first-time visits.`;
};

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
      ? `Submission rate (${currentRateStr}) dropped significantly below the prior 4-week average baseline (${baselineRateStr}). Attention needed.`
      : "Submission rate dropped noticeably below the studio baseline. Attention needed.";

    return (
      <Tooltip content={message}>
        <span className="inline-flex items-center justify-center w-7 h-7 text-amber-700 bg-amber-50 rounded-full border border-amber-200 cursor-help hover:bg-amber-100 transition-colors shadow-2xs">
          <TrendingDown className="w-4 h-4" />
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
      ? `Submission rate (${currentRateStr}) meets or exceeds the prior 4-week average baseline (${baselineRateStr}). Great performance!`
      : "Submission rate meets or exceeds the studio baseline.";

    return (
      <Tooltip content={message}>
        <span className="inline-flex items-center justify-center w-7 h-7 text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 cursor-help hover:bg-emerald-100 transition-colors shadow-2xs">
          <TrendingUp className="w-4 h-4" />
        </span>
      </Tooltip>
    );
  }

  if (!week.baseline) {
    return (
      <Tooltip content="Fewer than 8 first visits in the prior 4 weeks — not enough visit history to establish a reliable baseline.">
        <span className="inline-flex items-center justify-center w-7 h-7 text-grey-3 bg-neutral-quaternary/40 rounded-full border border-neutral-tertiary cursor-help text-[11px] font-bold">
          ?
        </span>
      </Tooltip>
    );
  }

  const normalMessage = baselineRateStr
    ? `Submission rate (${currentRateStr}) is within normal weekly expected range of the baseline (${baselineRateStr}).`
    : "Submission rate is within normal expected weekly variation.";

  return (
    <Tooltip content={normalMessage}>
      <span className="inline-flex items-center justify-center w-7 h-7 text-grey-2 bg-neutral-quaternary/30 rounded-full border border-neutral-tertiary cursor-help hover:bg-neutral-quaternary/60 transition-colors text-[11px] font-bold">
        —
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
    <div
      className={`overflow-x-auto rounded-2xl border border-neutral-tertiary shadow-2xs ${
        compact ? "text-[11px]" : "text-xs"
      }`}
    >
      <table className="w-full text-left text-grey-5">
        <thead className="bg-neutral-quaternary/60 text-grey-2 font-bold uppercase tracking-wider border-b border-neutral-tertiary">
          <tr>
            <th className={`${compact ? "py-2.5 px-3" : "py-3 px-4"} whitespace-nowrap`}>
              Week
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-normal leading-tight max-w-[75px]`}
            >
              1st Visits
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-normal leading-tight max-w-[80px]`}
            >
              With Form
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-normal leading-tight max-w-[90px]`}
            >
              Forms Submitted
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-normal leading-tight max-w-[100px]`}
            >
              Submission Rate
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-normal leading-tight max-w-[140px]`}
            >
              Prior 4-week Average Submission Rate
            </th>
            <th
              className={`${compact ? "py-2.5 px-2" : "py-3 px-3"} text-center whitespace-nowrap`}
            >
              Trend
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-tertiary bg-white">
          {weeks.map((week, idx) => (
            <tr
              key={idx}
              className={`hover:bg-neutral-quaternary/40 transition-colors font-semibold ${
                idx % 2 === 1 ? "bg-neutral-quaternary/20" : ""
              }`}
            >
              <td
                className={`${compact ? "py-2 px-3" : "py-3 px-4"} font-bold text-dark-1 whitespace-nowrap`}
              >
                {formatWeekRange(week.week_start, week.week_end)}
                {!week.complete && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    In progress
                  </span>
                )}
              </td>
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center font-bold text-dark-1`}
              >
                {week.first_visits}
              </td>
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center text-emerald-700 font-bold`}
              >
                {week.with_form}
              </td>
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center text-grey-2`}
              >
                <Tooltip
                  content={getFormsSubmittedTooltip(
                    week.forms_submitted,
                    week.with_form
                  )}
                >
                  <span
                    className={`cursor-help ${
                      week.forms_submitted !== week.with_form
                        ? "border-b border-dashed border-grey-5 font-bold text-dark-1"
                        : ""
                    }`}
                  >
                    {week.forms_submitted}
                  </span>
                </Tooltip>
              </td>
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center font-black text-dark-1`}
              >
                {pct(week.rate)}
              </td>
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center text-grey-2`}
              >
                {week.baseline?.rate !== null &&
                week.baseline?.rate !== undefined ? (
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
              <td
                className={`${compact ? "py-2 px-2" : "py-3 px-3"} text-center`}
              >
                <WeekStatusBadge week={week} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ────────────────────── location visual trendline ────────────────────── */

const LocationWeeklyTrendChart: React.FC<{ weeks: InsightWeek[] }> = ({ weeks }) => {
  if (!weeks || weeks.length === 0) return null;

  const chartData = weeks.map((w) => ({
    weekLabel: formatWeekShort(w.week_start, w.week_end),
    fullWeekRange: formatWeekRange(w.week_start, w.week_end),
    rate: w.rate !== null && w.rate !== undefined ? Number(w.rate.toFixed(1)) : null,
    baseline:
      w.baseline?.rate !== null && w.baseline?.rate !== undefined
        ? Number(w.baseline.rate.toFixed(1))
        : null,
    firstVisits: w.first_visits,
    withForm: w.with_form,
    formsSubmitted: w.forms_submitted,
    complete: w.complete,
  }));

  return (
    <div className="mb-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-tertiary shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-dark-1">
          <TrendingUp className="w-3.5 h-3.5 text-[#368591]" />
          <span>Weekly Submission Rate vs. Prior 4-Week Average Baseline</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-grey-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#368591]" />
            Submission Rate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-500" />
            Prior 4-Week Baseline
          </span>
        </div>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 600 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div className="bg-dark-1/95 text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs backdrop-blur-xs min-w-[210px]">
                    <div className="font-extrabold text-white mb-2 pb-1.5 border-b border-white/10 flex items-center justify-between gap-2">
                      <span>{d.fullWeekRange}</span>
                      {!d.complete && (
                        <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-black uppercase">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#368591]" />
                          Submission Rate:
                        </span>
                        <span className="font-bold text-white">
                          {d.rate !== null ? `${d.rate}%` : "N/A"}
                          <span className="text-zinc-400 font-normal ml-1">
                            ({d.withForm}/{d.firstVisits})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                          <span className="w-2.5 h-0.5 border-b-2 border-dashed border-amber-400" />
                          Prior 4-wk Average:
                        </span>
                        <span className="font-bold text-amber-300">
                          {d.baseline !== null ? `${d.baseline}%` : "No history"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/10 text-[11px] text-zinc-300">
                        <span>Forms Submitted This Week:</span>
                        <span className="font-bold text-white">{d.formsSubmitted}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Submission Rate"
              stroke="#368591"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#368591", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Prior 4-Week Average"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }}
              activeDot={{ r: 4.5, stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ────────────────────── expandable location card ────────────────────── */

const LocationCard: React.FC<{
  loc: IntakeInsightsData["locations"][0];
  globalMissingDates?: Set<string>;
}> = ({ loc, globalMissingDates = new Set() }) => {
  const [expanded, setExpanded] = useState(false);
  const streak = loc.streak;
  const isRobotActive = loc.robot_selected !== false;
  const baseRateStr =
    streak.baseline && streak.baseline.rate !== null
      ? `${streak.baseline.rate.toFixed(1)}%`
      : null;

  // Isolate missing days specific to this location vs. system-wide missing days
  const locMissingDays = Array.from(
    new Set(loc.weeks.flatMap((w) => w.missing_days || []))
  );
  const locationSpecificMissing = locMissingDays.filter(
    (day) => !globalMissingDates.has(day)
  );

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        !isRobotActive
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

            {/* Studio-specific data quality */}
            {locationSpecificMissing.length > 0 ? (
              <div className="text-[10px] text-amber-700 flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                <span>
                  {locationSpecificMissing.length} day{locationSpecificMissing.length > 1 ? "s" : ""} with missing data specific to this studio
                </span>
              </div>
            ) : locMissingDays.length > 0 ? (
              <Tooltip
                content={`${locMissingDays.length} dates had un-synced visit records system-wide across reported weeks. There is no missing data specific to this studio.`}
              >
                <div className="text-[10px] text-grey-5 flex items-center gap-1 cursor-help font-medium">
                  <Info className="w-3 h-3 text-grey-4 shrink-0" />
                  <span>All data recorded for this studio ({locMissingDays.length} system-wide dates excluded)</span>
                </div>
              </Tooltip>
            ) : null}
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

      {/* Expandable weekly breakdown: Visual Trendline + Data Table */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[1600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-neutral-tertiary bg-neutral-quaternary/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-grey-2">
              Weekly Breakdown & Trendline — {loc.location_name}
            </h4>
          </div>

          {/* Location Weekly Trendline */}
          <LocationWeeklyTrendChart weeks={loc.weeks} />

          {/* Location Weekly Breakdown Table */}
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

  // Compute franchise / system-wide missing days
  const globalMissingDates = new Set<string>(
    weeksList.flatMap((w) => w.missing_days || [])
  );

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
          <Tooltip content="Each week's submission rate is compared against the prior 4-week average baseline. Trend indicates if completion meets or dropped below the studio baseline.">
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
              <Tooltip content="Each location's current streak of first visits without an intake form. An 'Unusual' streak would happen less than 5% of the time at the location's own baseline rate. Click a card to see weekly details and visual trendlines.">
                <Info className="w-3.5 h-3.5 text-grey-5 cursor-help" />
              </Tooltip>
            </div>

            {globalMissingDates.size > 0 && (
              <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">
                  <strong className="font-bold text-amber-900">Franchise Data Notice:</strong> Across the reported weeks, {globalMissingDates.size} date{globalMissingDates.size > 1 ? "s have" : " has"} un-synced visit records system-wide. Location cards below show only gaps specific to that studio.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {insightsData.locations.map((loc) => (
                <LocationCard
                  key={loc.location_id}
                  loc={loc}
                  globalMissingDates={globalMissingDates}
                />
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

