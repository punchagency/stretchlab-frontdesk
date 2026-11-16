import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Target,
  CalendarDays,
  Sparkles,
  Clock,
  CheckCircle2,
  FileWarning,
  Info,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  ActionBadge,
  ClientActionRow,
  localDay,
  MustGetItem,
  ActionEntry,
  SkipActionKind,
  SkipReasonOption,
} from "../../service/clientActions";
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
  isToggling?: boolean;
  isLoggingAction?: boolean;
  isSplit?: boolean;
}

export const ActionBadgeChip: React.FC<ActionBadgeChipProps> = ({
  badgeKey,
  row,
  todayStr,
  onGoalClick,
  onToggleFollowUp,
  onLogMaps,
  onLogBookNext,
  isToggling,
  isLoggingAction,
  isSplit = false,
}) => {
  const currentToday = todayStr || localDay();
  const isToday = row.booking_date === currentToday;
  const pillShape = isSplit ? "rounded-l-xl rounded-r-none border-r-0" : "rounded-xl";

  switch (badgeKey) {
    case "intake_form_missing": {
      const mustGetItem = row.must_get?.find((m) => m.action === "intake_form");
      const isReminded = mustGetItem ? Boolean(mustGetItem.done) : Boolean(row.intake?.follow_up?.checked);
      const actionInstruction = isToday
        ? "Resend text from SMS platform to have client fill out intake form upon arrival so we can provide the best service"
        : "Send text from SMS platform to remind client to fill out form prior to arrival so we can provide the best service";

      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={isToggling}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollowUp(row);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border disabled:opacity-50 ${
                  isReminded
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 shadow-2xs"
                }`}
              >
                {isToggling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
                ) : isReminded ? (
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
                disabled={isLoggingAction}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogMaps?.(row);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50`}
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
            disabled={isLoggingAction}
            onClick={(e) => {
              e.stopPropagation();
              onLogBookNext?.(row, needed);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-bold border shadow-2xs cursor-pointer disabled:opacity-50 ${badgeStyle}`}
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
                disabled={isLoggingAction}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogBookNext?.(row, needed);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-bold border transition-colors cursor-pointer shadow-2xs disabled:opacity-50 ${badgeStyle}`}
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs`}
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs`}
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${pillShape} text-xs font-black bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs`}
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

interface SkipReasonPopoverProps {
  reasons: SkipReasonOption[];
  isSkipping?: boolean;
  triggerClassName: string;
  onSelect: (reason: string, note?: string) => void;
}

const SkipReasonPopover: React.FC<SkipReasonPopoverProps> = ({
  reasons,
  isSkipping,
  triggerClassName,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const triggerWrapRef = useRef<HTMLSpanElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 248,
  });

  const computeMenuPosition = (rect: DOMRect) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = Math.min(264, vw - 24);
    const estimatedHeight = 48 + reasons.length * 36 + (showNote ? 48 : 28);

    const left = Math.max(12, Math.min(rect.right - menuWidth, vw - menuWidth - 12));
    const spaceBelow = vh - rect.bottom - 12;
    const top =
      spaceBelow >= estimatedHeight || spaceBelow >= rect.top - 12
        ? rect.bottom + 6
        : Math.max(12, rect.top - estimatedHeight - 6);

    return { top, left, width: menuWidth };
  };

  useLayoutEffect(() => {
    if (!open || !triggerWrapRef.current) return;
    setMenuPos(computeMenuPosition(triggerWrapRef.current.getBoundingClientRect()));
  }, [open, reasons.length, showNote]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerWrapRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <span ref={triggerWrapRef} className="inline-flex">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={isSkipping}
                aria-label="Not done — select reason"
                aria-expanded={open}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!open) {
                    setMenuPos(computeMenuPosition(e.currentTarget.getBoundingClientRect()));
                  }
                  setOpen((prev) => !prev);
                }}
                className={`inline-flex items-center justify-center px-1.5 py-1 rounded-r-xl rounded-l-none border border-l transition-colors cursor-pointer disabled:opacity-50 ${triggerClassName}`}
              >
                {isSkipping ? (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] px-2 py-1">
              Not done? Add reason
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
            className="z-50 rounded-2xl bg-white border border-neutral-tertiary shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between px-2 pt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-grey-5">
                Not done — why?
              </span>
            </div>

            <div className="space-y-0.5">
              {reasons.map((opt) => (
                <button
                  key={opt.reason}
                  type="button"
                  disabled={isSkipping}
                  onClick={() => {
                    const trimmed = note.trim();
                    onSelect(opt.reason, trimmed || undefined);
                    setNote("");
                    setShowNote(false);
                    setOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-dark-1 hover:bg-primary-base/10 hover:text-primary-base active:bg-primary-base/15 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="pt-1 border-t border-neutral-tertiary/60">
              {showNote ? (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  autoFocus
                  placeholder="Optional note (then pick reason)..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-tertiary bg-neutral-quaternary/40 text-dark-1 placeholder:text-grey-2 focus:outline-none focus:ring-2 focus:ring-primary-base/30 focus:border-primary-base"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNote(true)}
                  className="w-full text-left px-2 py-1 text-[11px] font-semibold text-grey-5 hover:text-dark-1 transition-colors cursor-pointer"
                >
                  + Add optional note
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const getSplitTriggerStyle = (
  action: SkipActionKind,
  row: ClientActionRow,
  goalBadge: ActionBadge
): string => {
  if (action === "maps") {
    return "bg-slate-100 text-slate-600 border-slate-300 border-l-slate-300/80 hover:bg-slate-200";
  }
  if (action === "book_next") {
    const count = row.booking_guidance?.booked_ahead ?? row.future_bookings.count ?? 0;
    const priority =
      row.booking_guidance?.priority ?? (count === 0 ? "high" : count === 1 ? "medium" : "low");
    if (priority === "high") {
      return "bg-rose-50 text-rose-700 border-rose-300 border-l-rose-300/80 hover:bg-rose-100";
    }
    if (priority === "medium") {
      return "bg-amber-50 text-amber-700 border-amber-300 border-l-amber-300/80 hover:bg-amber-100";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-200 border-l-indigo-200/80 hover:bg-indigo-100";
  }
  if (goalBadge === "goal_template") {
    return "bg-orange-50 text-orange-800 border-orange-300 border-l-orange-300/80 hover:bg-orange-100";
  }
  if (goalBadge === "goal_update_due") {
    return "bg-amber-50 text-amber-700 border-amber-300 border-l-amber-300/80 hover:bg-amber-100";
  }
  return "bg-purple-50 text-purple-700 border-purple-200 border-l-purple-200/80 hover:bg-purple-100";
};

export interface MustGetChipProps {
  item: MustGetItem;
  row: ClientActionRow;
  todayStr?: string;
  skipReasons?: Partial<Record<SkipActionKind, SkipReasonOption[]>>;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onLogMaps?: (row: ClientActionRow) => void;
  onLogBookNext?: (row: ClientActionRow, count?: number) => void;
  onUndoAction?: (entry: ActionEntry) => void;
  onSkipAction?: (
    row: ClientActionRow,
    action: SkipActionKind,
    reason: string,
    note?: string
  ) => void;
  isToggling?: boolean;
  isLoggingAction?: boolean;
  isSkippingAction?: boolean;
  undoingEntryId?: number | null;
}

export const MustGetChip: React.FC<MustGetChipProps> = ({
  item,
  row,
  todayStr,
  skipReasons,
  onGoalClick,
  onToggleFollowUp,
  onLogMaps,
  onLogBookNext,
  onSkipAction,
  isToggling,
  isLoggingAction,
  isSkippingAction,
}) => {
  // If the action is already logged or skipped, it appears in the "LOGGED:" / "SKIPPED:" section,
  // so it is removed from "MUST GET:". If undone, it returns here.
  if (item.done || item.skipped) {
    return null;
  }

  const actionSkipOptions =
    item.can_skip && item.action !== "intake_form"
      ? skipReasons?.[item.action] || []
      : [];

  const goalBadge: ActionBadge =
    item.badges.find((b) => b === "goal_template" || b === "goal_update_due") ||
    "goal_missing";

  const badgeKeyMap: Record<MustGetItem["action"], ActionBadge> = {
    intake_form: "intake_form_missing",
    maps: "maps_due",
    book_next: "future_bookings_below_target",
    goal: goalBadge,
  };

  const badgeKey = badgeKeyMap[item.action];
  if (!badgeKey) return null;

  const hasSplitSkip =
    actionSkipOptions.length > 0 &&
    Boolean(onSkipAction) &&
    item.action !== "intake_form";

  const badgeEl = (
    <ActionBadgeChip
      badgeKey={badgeKey}
      row={row}
      todayStr={todayStr}
      onGoalClick={onGoalClick}
      onToggleFollowUp={onToggleFollowUp}
      onLogMaps={onLogMaps}
      onLogBookNext={onLogBookNext}
      isToggling={isToggling}
      isLoggingAction={isLoggingAction}
      isSplit={hasSplitSkip}
    />
  );

  if (hasSplitSkip && onSkipAction && item.action !== "intake_form") {
    const skipAction = item.action as SkipActionKind;
    return (
      <div className="inline-flex items-stretch max-w-full">
        {badgeEl}
        <SkipReasonPopover
          reasons={actionSkipOptions}
          isSkipping={isSkippingAction}
          triggerClassName={getSplitTriggerStyle(skipAction, row, goalBadge)}
          onSelect={(reason, note) => onSkipAction(row, skipAction, reason, note)}
        />
      </div>
    );
  }

  return badgeEl;
};
