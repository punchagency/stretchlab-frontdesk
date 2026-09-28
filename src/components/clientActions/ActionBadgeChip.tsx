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
import { ActionBadge, ClientActionRow } from "../../service/clientActions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ActionBadgeChipProps {
  badgeKey: ActionBadge;
  row: ClientActionRow;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteModal?: (row: ClientActionRow) => void;
}

export const ActionBadgeChip: React.FC<ActionBadgeChipProps> = ({
  badgeKey,
  row,
  onGoalClick,
  onToggleFollowUp,
}) => {
  switch (badgeKey) {
    case "intake_form_missing": {
      const isReminded = Boolean(row.intake?.follow_up?.checked);
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
                    ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 shadow-2xs"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {isReminded
                    ? "Form missing · ✓ Reminded"
                    : "Form missing · Remind"}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {isReminded ? (
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-400">Intake Reminded</p>
                  {row.intake?.follow_up?.checked_by_name && (
                    <p>By: {row.intake.follow_up.checked_by_name}</p>
                  )}
                  {row.intake?.follow_up?.note && (
                    <p className="italic">Note: "{row.intake.follow_up.note}"</p>
                  )}
                  <p className="text-[10px] text-zinc-300 mt-1">
                    Click to toggle status
                  </p>
                </div>
              ) : (
                <p>
                  First-time client has not submitted their intake form. Click to
                  mark reminded.
                </p>
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-default">
                <Target className="w-3.5 h-3.5 text-slate-500" />
                <span>MAPS Due</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
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
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    case "future_bookings_below_target": {
      const guidance = row.booking_guidance;
      const count = guidance?.booked_ahead ?? row.future_bookings.count ?? 0;
      const target = guidance?.target ?? row.future_bookings.target ?? 4;
      const priority = guidance?.priority ?? (count === 0 ? "high" : count === 1 ? "medium" : "low");

      const badgeStyle =
        priority === "high"
          ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
          : priority === "medium"
          ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";

      const headline =
        guidance?.headline ||
        (count === 0
          ? "Nothing booked ahead"
          : count === 1
          ? "Only 1 visit booked ahead"
          : `${count} of ${target} visits booked ahead`);

      if (!guidance) {
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs cursor-default ${badgeStyle}`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>
              {headline} ({count}/{target})
            </span>
          </span>
        );
      }

      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-help shadow-2xs ${badgeStyle}`}
              >
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {headline} ({count}/{target})
                </span>
                <Info className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <p className="font-extrabold text-white text-[11px]">
                  {guidance.headline}
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
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>No goal on file</span>
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
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Goal update due ({row.goal.days_since}d)</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">Goal 90+ days old</p>
                <p className="italic">"{row.goal.goal}"</p>
                <p className="text-[10px] text-zinc-300">
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
                <span>Template goal ({templateClients})</span>
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
}

export const ActionBadgeList: React.FC<ActionBadgeListProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteModal,
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
        />
      ))}
    </div>
  );
};
