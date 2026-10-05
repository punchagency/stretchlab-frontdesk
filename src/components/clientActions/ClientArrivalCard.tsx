import React from "react";
import {
  User,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  Square,
  CheckSquare,
  Loader2,
  MessageSquare,
  MapPin,
  Clock,
  Target,
  CalendarDays,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  ClientActionRow,
  ActionEntry,
  toBook,
} from "../../service/clientActions";
import { ActionBadgeChip } from "./ActionBadgeChip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface ClientArrivalCardProps {
  row: ClientActionRow;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteDrawer: (row: ClientActionRow) => void;
  onLogMaps?: (row: ClientActionRow) => void;
  onLogBookNext?: (row: ClientActionRow, count?: number) => void;
  onUndoAction?: (entry: ActionEntry) => void;
  isLoggingAction?: boolean;
  undoingEntryId?: number | null;
  isToggling: boolean;
  copiedId: string | null;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  formatUtcDateTime: (stamp?: string | null) => string;
}

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatUtcTime = (stamp?: string | null) => {
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

const formatGoalSource = (source?: string | null): string => {
  if (!source) return "";
  switch (source) {
    case "intake":
      return "intake form";
    case "note":
      return "session note";
    case "front_desk":
      return "front desk";
    default:
      return source.replace(/_/g, " ");
  }
};

const ActionsTakenList: React.FC<{
  actions?: ActionEntry[] | null;
  onUndoAction?: (entry: ActionEntry) => void;
  undoingEntryId?: number | null;
}> = ({ actions, onUndoAction, undoingEntryId }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-neutral-tertiary/60 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-grey-5 mr-0.5 shrink-0">
        Logged:
      </span>
      {actions.map((entry) => {
        const isUndoable =
          entry.action === "maps" || entry.action === "book_next";
        const timeStr = entry.done_at ? formatUtcTime(entry.done_at) : "";
        const staffName = entry.staff_name || entry.done_by_name || "Desk";
        const checkStatus = entry.check?.status || "pending";

        let statusBadge = null;
        if (checkStatus === "confirmed") {
          statusBadge = (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Check className="w-2.5 h-2.5" /> Confirmed
            </span>
          );
        } else if (checkStatus === "pending") {
          statusBadge = (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Checking…
            </span>
          );
        } else if (checkStatus === "not_confirmed") {
          statusBadge = (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              Not Confirmed
            </span>
          );
        } else {
          statusBadge = (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
              Manual
            </span>
          );
        }

        const actionName =
          entry.action === "maps"
            ? "MAPS"
            : entry.action === "book_next"
            ? `Booked ${(entry.check?.evidence as any)?.claimed ?? (entry.check?.evidence as any)?.found ?? entry.booked_count ?? ""}`
            : entry.action === "intake_form"
            ? "Intake Form"
            : "Goal";

        return (
          <TooltipProvider key={entry.id} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-neutral-quaternary border border-neutral-tertiary">
                  <span className="font-bold text-dark-1">{actionName}</span>
                  {statusBadge}
                  <span className="text-[10px] text-grey-5 font-normal">
                    {staffName} {timeStr}
                  </span>
                  {isUndoable && onUndoAction && (
                    <button
                      type="button"
                      disabled={undoingEntryId === entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUndoAction(entry);
                      }}
                      className="ml-0.5 p-0.5 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Undo this action log"
                    >
                      {undoingEntryId === entry.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                      ) : (
                        <Undo2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs space-y-1">
                <p className="font-bold text-[11px]">
                  {actionName} logged by {staffName}
                </p>
                {entry.note && (
                  <p className="italic text-zinc-300">"{entry.note}"</p>
                )}
                {entry.action === "book_next" && (entry.check?.evidence as any)?.found != null && (
                  <p className="text-[10px] text-zinc-300">
                    {(entry.check?.evidence as any)?.claimed != null && `Claimed: ${(entry.check?.evidence as any).claimed} · `}
                    Found: {(entry.check?.evidence as any).found} appointment{((entry.check?.evidence as any).found === 1 ? "" : "s")}
                    {(entry.check?.evidence as any).found_bookings != null && (entry.check?.evidence as any).found_bookings !== (entry.check?.evidence as any).found && (
                      <span className="text-zinc-400"> ({(entry.check?.evidence as any).found_bookings} bookings)</span>
                    )}
                  </p>
                )}
                {entry.check?.reason && (
                  <p className="text-[10px] text-zinc-300 capitalize">
                    Reason: {entry.check.reason.replace(/_/g, " ")}
                  </p>
                )}
                {checkStatus === "pending" && (
                  <p className="text-[9px] text-zinc-400">
                    Normal on the day. Robot verifies overnight or at daytime run.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export const ClientArrivalCard: React.FC<ClientArrivalCardProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteDrawer,
  onLogMaps,
  onLogBookNext,
  onUndoAction,
  isLoggingAction,
  undoingEntryId,
  isToggling,
  copiedId,
  onCopyId,
  formatUtcDateTime,
}) => {
  const isStale = Boolean(row.stale);
  const isFollowUpChecked = Boolean(row.intake?.follow_up?.checked);
  const hasFollowUpNote = Boolean(row.intake?.follow_up?.note);
  const hasActions = row.badges.length > 0;
  const neededBookings = toBook(row) ?? 1;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:border-primary-base/40 ${
        hasActions
          ? "border-neutral-tertiary"
          : "border-neutral-tertiary/70 bg-neutral-quaternary/10"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Avatar, Client Name, CR ID, Session & Staff */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border ${
                row.first_visit
                  ? "bg-primary-base text-white border-primary-base shadow-xs"
                  : "bg-primary-base/10 text-primary-base border-primary-base/20"
              }`}
            >
              {getInitials(row.client_name)}
            </div>
            {row.first_visit && (
              <span
                title="First Time Client"
                className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-amber-950 border border-white shadow-2xs"
              >
                1st
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-dark-1 text-sm sm:text-base leading-tight truncate">
                {row.client_name || "Unknown Client"}
              </span>

              {/* Arrival time pill (e.g. 1:30 PM - 1:55 PM) */}
              {(row.booking_start || row.booking_end) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-quaternary text-dark-1 border border-neutral-tertiary text-[11px] font-black shadow-2xs">
                  <Clock className="w-3 h-3 text-primary-base" />
                  <span>{row.booking_start || "Open"}</span>
                  {row.booking_end && (
                    <span className="text-grey-5 font-bold">
                      - {row.booking_end}
                    </span>
                  )}
                </span>
              )}

              {row.first_visit && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-base/10 text-primary-base border border-primary-base/20">
                  First Visit
                </span>
              )}

              {isStale && row.last_seen_at && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>as of {formatUtcDateTime(row.last_seen_at)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>
                        This booking was not seen in the latest run. It may have
                        been rescheduled or cancelled in ClubReady.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-grey-5 flex-wrap">
              {row.clubready_user_id ? (
                <button
                  type="button"
                  onClick={(e) => onCopyId(row.clubready_user_id!, e)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-grey-2 hover:text-dark-1 cursor-pointer transition-colors"
                  title="Copy ClubReady User ID"
                >
                  <span>CR: {row.clubready_user_id}</span>
                  {copiedId === row.clubready_user_id ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-grey-2" />
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-grey-2">No CR ID</span>
              )}

              <span className="w-1 h-1 rounded-full bg-neutral-tertiary hidden sm:inline-block" />

              <span className="font-semibold text-dark-1 text-[11px] inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-grey-2 shrink-0" />
                <span>{row.booking_detail || "Stretch Session"}</span>
                {row.session_mins && (
                  <span className="text-grey-2 font-mono">
                    ({row.session_mins}m)
                  </span>
                )}
              </span>

              {row.booking_with && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-tertiary hidden sm:inline-block" />
                  <span className="text-[11px] inline-flex items-center gap-1 text-grey-5">
                    <User className="w-3 h-3 text-grey-2 shrink-0" />
                    <span>with</span>
                    <strong className="text-dark-1 font-bold">
                      {row.booking_with}
                    </strong>
                  </span>
                </>
              )}

              {row.location_name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-tertiary hidden md:inline-block" />
                  <span className="text-[11px] text-grey-5 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-grey-2 shrink-0" />
                    <span>{row.location_name}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Badges & Fast Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-tertiary/60">
          {/* Action Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {row.badges.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>✓ No Action Needed</span>
              </span>
            ) : (
              <>
                <span className="text-[11px] font-black uppercase tracking-wider text-grey-5 mr-0.5 shrink-0">
                  Must Get:
                </span>
                {row.badges.map((badgeKey) => (
                  <ActionBadgeChip
                    key={badgeKey}
                    badgeKey={badgeKey}
                    row={row}
                    onGoalClick={onGoalClick}
                    onToggleFollowUp={onToggleFollowUp}
                    onLogMaps={onLogMaps}
                    onLogBookNext={onLogBookNext}
                  />
                ))}
              </>
            )}
          </div>

          {/* Quick Action Buttons Group */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-neutral-tertiary/70">
            {/* Quick 1-click MAPS Log */}
            {row.badges.includes("maps_due") && onLogMaps && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoggingAction}
                      onClick={() => onLogMaps(row)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Target className="w-3.5 h-3.5 text-slate-300" />
                      <span>Log MAPS</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold text-[11px]">
                      Mark MAPS Assessment Completed
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Quick 1-click Book Next Log */}
            {row.badges.includes("future_bookings_below_target") &&
              onLogBookNext && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={isLoggingAction}
                        onClick={() => onLogBookNext(row, neededBookings)}
                        className="px-2.5 py-1.5 rounded-xl border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Log Booked ({neededBookings})</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold text-[11px]">
                        Mark {neededBookings} upcoming session(s) booked
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

            {row.clubready_user_id && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onGoalClick(row)}
                      className="p-2 rounded-xl border border-primary-base/20 bg-primary-base/5 hover:bg-primary-base hover:text-white text-primary-base font-extrabold transition-all cursor-pointer shadow-2xs group"
                      aria-label="View Record & Goals"
                    >
                      <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold text-[11px]">
                      View Record & Goals
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {row.intake && !row.intake.form_received && row.clubready_user_id && (
              <>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => onToggleFollowUp(row)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                          isFollowUpChecked
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-white text-zinc-400 border-zinc-300 hover:border-zinc-500 hover:text-zinc-700"
                        }`}
                        aria-label={
                          isFollowUpChecked
                            ? "Mark as un-reminded"
                            : "Mark as reminded"
                        }
                      >
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-base" />
                        ) : isFollowUpChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {isFollowUpChecked ? (
                        <div className="text-[11px] font-medium space-y-0.5">
                          <p className="font-bold text-emerald-400">
                            Intake Follow-up Completed
                          </p>
                          {row.intake.follow_up?.checked_by_name && (
                            <p>By: {row.intake.follow_up.checked_by_name}</p>
                          )}
                          {row.intake.follow_up?.checked_at && (
                            <p>
                              Time:{" "}
                              {formatUtcDateTime(
                                row.intake.follow_up.checked_at
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold text-[11px]">
                          Mark Followed Up (Reminded/Handed Form)
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onOpenNoteDrawer(row)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          hasFollowUpNote
                            ? "bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 shadow-2xs"
                            : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-600"
                        }`}
                        aria-label={
                          hasFollowUpNote
                            ? `Note: "${row.intake?.follow_up?.note}"`
                            : "Add follow-up note"
                        }
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-xs">
                      <p className="font-semibold text-[11px]">
                        {hasFollowUpNote
                          ? `Note: "${row.intake?.follow_up?.note}" (Click to edit)`
                          : "Add Follow-up Note"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goal & Why Preview */}
      {(row.goal?.goal || row.goal?.why) && (
        <div className="mt-3 pt-2.5 border-t border-neutral-tertiary/60 text-xs space-y-1">
          {row.goal.goal && (
            <div className="flex items-start gap-1.5 text-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span className="font-black text-dark-1 text-[11px]">Goal:</span>
              <span className="italic text-[11px] text-zinc-800 font-semibold">
                "{row.goal.goal}"
              </span>
              {row.goal.days_since !== null && (
                <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                  ({row.goal.days_since}d ago)
                </span>
              )}
            </div>
          )}
          {row.goal.why && (
            <div className="flex items-start gap-1.5 pl-5 text-[11px] leading-snug">
              <span className="font-bold text-purple-900 shrink-0">Why:</span>
              <div className="min-w-0 flex-1">
                <span className="italic text-zinc-700 font-medium">
                  "{row.goal.why}"
                </span>
                {row.goal.why_source && (
                  <span className="text-[10px] text-zinc-400 font-normal ml-1 inline-block">
                    · from {formatGoalSource(row.goal.why_source)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Taken Audit & Verification Bar */}
      <ActionsTakenList
        actions={row.actions_taken}
        onUndoAction={onUndoAction}
        undoingEntryId={undoingEntryId}
      />
    </div>
  );
};

export const ClientActionGridCard: React.FC<ClientArrivalCardProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteDrawer,
  onLogMaps,
  onLogBookNext,
  onUndoAction,
  isLoggingAction,
  undoingEntryId,
  isToggling,
  copiedId,
  onCopyId,
  formatUtcDateTime,
}) => {
  const isStale = Boolean(row.stale);
  const isFollowUpChecked = Boolean(row.intake?.follow_up?.checked);
  const hasFollowUpNote = Boolean(row.intake?.follow_up?.note);
  const hasActions = row.badges.length > 0;
  const neededBookings = toBook(row) ?? 1;

  return (
    <div
      className={`group relative bg-white rounded-3xl p-5 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between space-y-4 ${
        hasActions
          ? "border-neutral-tertiary hover:border-primary-base/50"
          : "border-neutral-tertiary/70 bg-neutral-quaternary/10 hover:border-neutral-tertiary"
      }`}
    >
      {/* Top Header: Time Pill & Status Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-quaternary text-dark-1 border border-neutral-tertiary text-xs font-black shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-primary-base" />
          <span>{row.booking_start || "Open Visit"}</span>
          {row.booking_end && (
            <span className="text-grey-5 font-bold">
              - {row.booking_end}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {row.first_visit && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary-base/10 text-primary-base border border-primary-base/20">
              1st Visit
            </span>
          )}
          {row.location_name && (
            <span className="text-[11px] text-grey-5 font-semibold inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-grey-2 shrink-0" />
              <span className="truncate max-w-[120px]">
                {row.location_name}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Middle: Client Profile */}
      <div className="flex items-start gap-3.5 pt-1">
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border ${
              row.first_visit
                ? "bg-primary-base text-white border-primary-base shadow-xs"
                : "bg-primary-base/10 text-primary-base border-primary-base/20"
            }`}
          >
            {getInitials(row.client_name)}
          </div>
          {row.first_visit && (
            <span
              title="First Time Client"
              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-amber-950 border border-white shadow-2xs"
            >
              1st
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-black text-dark-1 text-base leading-snug truncate">
            {row.client_name || "Unknown Client"}
          </h4>

          <div className="flex items-center gap-2 text-xs text-grey-5 flex-wrap">
            {row.clubready_user_id ? (
              <button
                type="button"
                onClick={(e) => onCopyId(row.clubready_user_id!, e)}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-grey-2 hover:text-dark-1 cursor-pointer transition-colors"
                title="Copy ClubReady User ID"
              >
                <span>CR: {row.clubready_user_id}</span>
                {copiedId === row.clubready_user_id ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-grey-2" />
                )}
              </button>
            ) : (
              <span className="text-[11px] text-grey-2">No CR ID</span>
            )}

            {isStale && row.last_seen_at && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{formatUtcDateTime(row.last_seen_at)}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>
                      This booking was not seen in the latest run. It may have
                      been rescheduled or cancelled in ClubReady.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="text-xs text-grey-5 pt-0.5 space-y-0.5">
            <p className="font-bold text-dark-1 text-xs">
              {row.booking_detail || "Stretch Session"}
              {row.session_mins && (
                <span className="text-grey-2 font-normal ml-1">
                  ({row.session_mins}m)
                </span>
              )}
            </p>
            {row.booking_with && (
              <p className="text-[11px] text-grey-5 flex items-center gap-1">
                <User className="w-3 h-3 text-grey-2 shrink-0" />
                <span>with</span>
                <span className="font-bold text-dark-1">
                  {row.booking_with}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Goal & Why Preview */}
      {(row.goal?.goal || row.goal?.why) && (
        <div className="pt-2.5 pb-0.5 border-t border-neutral-tertiary/60 text-xs space-y-1.5">
          {row.goal.goal && (
            <div className="flex items-start gap-1.5 text-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 leading-snug">
                <span className="font-black text-dark-1 text-[11px] mr-1">Goal:</span>
                <span className="italic text-[11px] text-zinc-800 font-semibold">
                  "{row.goal.goal}"
                </span>
                {row.goal.days_since !== null && (
                  <span className="text-[10px] text-zinc-400 font-normal ml-1 shrink-0">
                    ({row.goal.days_since}d ago)
                  </span>
                )}
              </div>
            </div>
          )}
          {row.goal.why && (
            <div className="flex items-start gap-1.5 pl-5 text-[11px] leading-snug">
              <span className="font-bold text-purple-900 shrink-0">Why:</span>
              <div className="min-w-0 flex-1">
                <span className="italic text-zinc-700 font-medium">
                  "{row.goal.why}"
                </span>
                {row.goal.why_source && (
                  <span className="text-[10px] text-zinc-400 font-normal ml-1 inline-block">
                    · from {formatGoalSource(row.goal.why_source)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Action Badges */}
      <div className="pt-2 border-t border-neutral-tertiary/60 min-h-[44px] flex items-center">
        <div className="flex flex-wrap items-center gap-1.5 w-full">
          {row.badges.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>✓ No Action Needed</span>
            </span>
          ) : (
            <>
              <span className="text-[11px] font-black uppercase tracking-wider text-grey-5 mr-0.5 shrink-0">
                Must Get:
              </span>
              {row.badges.map((badgeKey) => (
                <ActionBadgeChip
                  key={badgeKey}
                  badgeKey={badgeKey}
                  row={row}
                  onGoalClick={onGoalClick}
                  onToggleFollowUp={onToggleFollowUp}
                  onLogMaps={onLogMaps}
                  onLogBookNext={onLogBookNext}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Actions Taken Audit & Verification Bar */}
      <ActionsTakenList
        actions={row.actions_taken}
        onUndoAction={onUndoAction}
        undoingEntryId={undoingEntryId}
      />

      {/* Footer: Quick Action Buttons */}
      <div className="pt-3 border-t border-neutral-tertiary/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {row.badges.includes("maps_due") && onLogMaps && (
            <button
              type="button"
              disabled={isLoggingAction}
              onClick={() => onLogMaps(row)}
              className="px-2 py-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50"
            >
              <Target className="w-3 h-3 text-slate-300" />
              <span>Log MAPS</span>
            </button>
          )}

          {row.badges.includes("future_bookings_below_target") &&
            onLogBookNext && (
              <button
                type="button"
                disabled={isLoggingAction}
                onClick={() => onLogBookNext(row, neededBookings)}
                className="px-2 py-1 rounded-xl border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50"
              >
                <CalendarDays className="w-3 h-3 text-indigo-200" />
                <span>Log Booked ({neededBookings})</span>
              </button>
            )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {row.clubready_user_id && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onGoalClick(row)}
                    className="p-2 rounded-xl border border-primary-base/20 bg-primary-base/5 hover:bg-primary-base hover:text-white text-primary-base font-extrabold transition-all cursor-pointer shadow-2xs group"
                    aria-label="View Record & Goals"
                  >
                    <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold text-[11px]">
                    View Record & Goals
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {row.intake && !row.intake.form_received && row.clubready_user_id && (
            <>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => onToggleFollowUp(row)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                        isFollowUpChecked
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "bg-white text-zinc-400 border-zinc-300 hover:border-zinc-500 hover:text-zinc-700"
                      }`}
                      aria-label={
                        isFollowUpChecked
                          ? "Mark as un-reminded"
                          : "Mark as reminded"
                      }
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary-base" />
                      ) : isFollowUpChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isFollowUpChecked ? (
                      <div className="text-[11px] font-medium space-y-0.5">
                        <p className="font-bold text-emerald-400">
                          Intake Follow-up Completed
                        </p>
                        {row.intake.follow_up?.checked_by_name && (
                          <p>By: {row.intake.follow_up.checked_by_name}</p>
                        )}
                        {row.intake.follow_up?.checked_at && (
                          <p>
                            Time:{" "}
                            {formatUtcDateTime(
                              row.intake.follow_up.checked_at
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-[11px]">
                        Mark Followed Up (Reminded/Handed Form)
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onOpenNoteDrawer(row)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        hasFollowUpNote
                          ? "bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 shadow-2xs"
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-600"
                      }`}
                      aria-label={
                        hasFollowUpNote
                          ? `Note: "${row.intake?.follow_up?.note}"`
                          : "Add follow-up note"
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    <p className="font-semibold text-[11px]">
                      {hasFollowUpNote
                        ? `Note: "${row.intake?.follow_up?.note}" (Click to edit)`
                        : "Add Follow-up Note"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

