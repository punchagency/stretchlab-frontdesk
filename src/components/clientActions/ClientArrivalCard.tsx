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
} from "lucide-react";
import { ClientActionRow } from "../../service/clientActions";
import { ActionBadgeChip } from "./ActionBadgeChip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ClientArrivalCardProps {
  row: ClientActionRow;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteDrawer: (row: ClientActionRow) => void;
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

export const ClientArrivalCard: React.FC<ClientArrivalCardProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteDrawer,
  isToggling,
  copiedId,
  onCopyId,
  formatUtcDateTime,
}) => {
  const isStale = Boolean(row.stale);
  const isFollowUpChecked = Boolean(row.intake?.follow_up?.checked);
  const hasFollowUpNote = Boolean(row.intake?.follow_up?.note);
  const hasActions = row.badges.length > 0;

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

              {/* Arrival time pill (e.g. 1:30 PM - 1:55 PM) in light mode */}
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
                <span>✓ All Clear</span>
              </span>
            ) : (
              row.badges.map((badgeKey) => (
                <ActionBadgeChip
                  key={badgeKey}
                  badgeKey={badgeKey}
                  row={row}
                  onGoalClick={onGoalClick}
                  onToggleFollowUp={onToggleFollowUp}
                />
              ))
            )}
          </div>

          {/* Quick Action Buttons Group */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-neutral-tertiary/70">
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
    </div>
  );
};

export const ClientActionGridCard: React.FC<ClientArrivalCardProps> = ({
  row,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteDrawer,
  isToggling,
  copiedId,
  onCopyId,
  formatUtcDateTime,
}) => {
  const isStale = Boolean(row.stale);
  const isFollowUpChecked = Boolean(row.intake?.follow_up?.checked);
  const hasFollowUpNote = Boolean(row.intake?.follow_up?.note);
  const hasActions = row.badges.length > 0;

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

      {/* Critical Action Badges */}
      <div className="pt-2 border-t border-neutral-tertiary/60 min-h-[44px] flex items-center">
        <div className="flex flex-wrap items-center gap-1.5 w-full">
          {row.badges.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>✓ All Clear</span>
            </span>
          ) : (
            row.badges.map((badgeKey) => (
              <ActionBadgeChip
                key={badgeKey}
                badgeKey={badgeKey}
                row={row}
                onGoalClick={onGoalClick}
                onToggleFollowUp={onToggleFollowUp}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer: Quick Action Buttons */}
      <div className="pt-3 border-t border-neutral-tertiary/60 flex items-center justify-between">
        <span className="text-[11px] font-bold text-grey-5">
          {hasActions
            ? `${row.badges.length} action${
                row.badges.length === 1 ? "" : "s"
              }`
            : "All Done"}
        </span>

        <div className="flex items-center gap-1.5">
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
