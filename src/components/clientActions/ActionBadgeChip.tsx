import React from "react";
import {
  FileText,
  Target,
  CalendarDays,
  Sparkles,
  Clock,
  CheckCircle2,
  FileWarning,
  Info,
} from "lucide-react";
import { ActionBadge, ClientActionRow, localDay } from "../../service/clientActions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ActionBadgeChipProps {
  badgeKey: ActionBadge;
  row: ClientActionRow;
  todayStr?: string;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteModal?: (row: ClientActionRow) => void;
  onLogMaps?: (row: ClientActionRow) => void;
  onLogBookNext?: (row: ClientActionRow, count?: number) => void;
}

export const ActionBadgeChip: React.FC<ActionBadgeChipProps> = ({
  badgeKey,
  row,
  todayStr,
  onGoalClick,
  onToggleFollowUp,
  onLogMaps,
  onLogBookNext,
}) => {
  const currentToday = todayStr || localDay();
  const isToday = row.booking_date === currentToday;

  switch (badgeKey) {
    case "intake_form_missing": {
      const isReminded = Boolean(row.intake?.follow_up?.checked);
      const actionInstruction = isToday
        ? "Resend text from SMS platform to have client fill out intake form upon arrival so we can provide the best service"
        : "Send text from SMS platform to remind client to fill out form prior to arrival so we can provide the best service";

      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollowUp(row);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isReminded
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 shadow-2xs"
                }`}
              >
                {isReminded ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{isReminded ? "Intake Form ✓" : "Intake Form"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
              {isReminded ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <p className="font-extrabold text-emerald-400 text-[11px]">
                      Intake Form Reminded
                    </p>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Done
                    </span>
                  </div>
                  {row.intake?.follow_up?.checked_by_name && (
                    <p className="text-[11px] text-zinc-200">
                      Action taken by: <strong className="text-white">{row.intake.follow_up.checked_by_name}</strong>
                    </p>
                  )}
                  {row.intake?.follow_up?.note && (
                    <p className="text-[11px] text-zinc-300 italic">
                      Note: "{row.intake.follow_up.note}"
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-300 pt-0.5 leading-snug">
                    {actionInstruction}
                  </p>
                  <p className="text-[10px] text-zinc-400 pt-0.5">
                    (Click to toggle status)
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-extrabold text-rose-400 text-[11px]">
                    Intake Form Action Needed
                  </p>
                  <p className="text-[11px] text-zinc-200 leading-snug">
                    {actionInstruction}
                  </p>
                  <p className="text-[10px] text-zinc-400 pt-0.5">
                    (Click to mark reminded)
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "maps_due": {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogMaps?.(row);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>MAPS</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
              {row.maps.last_reading ? (
                <div className="space-y-0.5">
                  <p className="font-bold">Last MAPS Assessment:</p>
                  <p className="italic text-slate-300 text-[11px]">
                    {row.maps.last_reading}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {row.maps.days_since_reading} days ago ({row.maps.reading_date})
                  </p>
                </div>
              ) : (
                <p>
                  No MAPS reading at this studio in the last 30 days. Book assessment.
                </p>
              )}
              {onLogMaps && (
                <p className="text-[10px] text-slate-300 font-bold pt-0.5">
                  👉 Click to log MAPS completed
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "future_bookings_below_target": {
      const guidance = row.booking_guidance;
      const count = guidance?.booked_ahead ?? row.future_bookings.count ?? 0;
      const target = guidance?.target ?? row.future_bookings.target ?? 4;
      const needed = guidance?.to_book ?? Math.max(1, target - count);
      const priority = guidance?.priority ?? (count === 0 ? "high" : count === 1 ? "medium" : "low");

      const badgeStyle =
        priority === "high"
          ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
          : priority === "medium"
          ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";

      const headline = `Book Next ${needed} Appointment${needed === 1 ? "" : "s"}`;

      if (!guidance) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLogBookNext?.(row, needed);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer ${badgeStyle}`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{headline}</span>
          </button>
        );
      }

      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogBookNext?.(row, needed);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${badgeStyle}`}
              >
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>{headline}</span>
                <Info className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <p className="font-extrabold text-white text-[11px]">
                  {guidance.headline || headline}
                </p>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                    priority === "high"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : priority === "medium"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  }`}
                >
                  {priority} priority
                </span>
              </div>

              {guidance.suggestion && (
                <p className="text-[11px] text-zinc-200 leading-snug">
                  {guidance.suggestion}
                </p>
              )}

              {guidance.booking_habit && (
                <div className="pt-0.5 text-[11px] text-zinc-300 font-medium bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Member Booking Habit
                  </p>
                  <p className="text-zinc-200 text-xs leading-snug">
                    {guidance.booking_habit}
                  </p>
                </div>
              )}

              {row.future_bookings.bookings !== undefined &&
                row.future_bookings.bookings !== null &&
                row.future_bookings.count !== null &&
                row.future_bookings.bookings !== row.future_bookings.count && (
                  <p className="text-[10px] text-zinc-300 font-medium">
                    Schedule: <strong className="text-white">{row.future_bookings.count} appointments</strong> ({row.future_bookings.bookings} total session bookings)
                  </p>
                )}

              {guidance.suggested_dates && guidance.suggested_dates.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Suggested Dates (Member Habit):
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {guidance.suggested_dates.map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] font-bold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {guidance.action && (
                <p className="text-[10px] text-amber-300 font-medium italic pt-0.5">
                  💡 {guidance.action}
                </p>
              )}

              {onLogBookNext && (
                <p className="text-[10px] text-indigo-300 font-bold pt-0.5">
                  👉 Click to log {needed} appointment{needed === 1 ? "" : "s"} booked
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "goal_missing": {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoalClick(row);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>Goal</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>
                No wellness goal on file. Click to ask client and record their
                goal.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "goal_update_due": {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoalClick(row);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Goal (Update Due)</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">Goal 90+ days old ({row.goal.days_since}d)</p>
                <p className="italic text-zinc-200">"{row.goal.goal}"</p>
                {row.goal.source && (
                  <p className="text-[10px] text-zinc-400 capitalize">
                    Source: {row.goal.source.replace("_", " ")}
                  </p>
                )}
                <p className="text-[10px] text-zinc-300 pt-0.5">
                  Click to confirm if still same or update
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "goal_template": {
      const templateClients = row.goal.template_clients ?? 3;
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoalClick(row);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs"
              >
                <FileWarning className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Goal (Template)</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <p className="font-extrabold text-orange-400 text-[11px]">
                  Boilerplate Goal Detected
                </p>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  {templateClients} clients
                </span>
              </div>
              <p className="text-[11px] text-zinc-200">
                The flexologist gave the exact same wording to {templateClients} clients in the last 180 days.
              </p>
              {row.goal.goal && (
                <p className="italic text-[11px] text-zinc-300 bg-white/10 p-1.5 rounded">
                  "{row.goal.goal}"
                </p>
              )}
              <p className="text-[10px] text-primary-base font-bold pt-0.5">
                👉 Click to ask member for their personal goal
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    default:
      return null;
  }
};

interface ActionBadgeListProps {
  row: ClientActionRow;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteModal?: (row: ClientActionRow) => void;
  onLogMaps?: (row: ClientActionRow) => void;
  onLogBookNext?: (row: ClientActionRow, count?: number) => void;
}

export const ActionBadgeList: React.FC<ActionBadgeListProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteModal,
  onLogMaps,
  onLogBookNext,
}) => {
  if (row.badges.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        No open actions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {row.badges.map((badgeKey) => (
        <ActionBadgeChip
          key={badgeKey}
          badgeKey={badgeKey}
          row={row}
          onGoalClick={onGoalClick}
          onToggleFollowUp={onToggleFollowUp}
          onOpenNoteModal={onOpenNoteModal}
          onLogMaps={onLogMaps}
          onLogBookNext={onLogBookNext}
        />
      ))}
    </div>
  );
};
