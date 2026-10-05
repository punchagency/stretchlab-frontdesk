import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  ClientActionRow,
  ActionEntry,
  actionRowKey,
} from "../../service/clientActions";
import { ClientArrivalCard } from "./ClientArrivalCard";
import { ClientActionsPagination } from "./ClientActionsPagination";

interface ClientArrivalTimelineProps {
  bookings: ClientActionRow[];
  selectedDate: string;
  todayStr: string;
  onGoalClick: (row: ClientActionRow) => void;
  onToggleFollowUp: (row: ClientActionRow) => void;
  onOpenNoteDrawer: (row: ClientActionRow) => void;
  onLogMaps?: (row: ClientActionRow) => void;
  onLogBookNext?: (row: ClientActionRow, count?: number) => void;
  onUndoAction?: (entry: ActionEntry) => void;
  isLoggingAction?: boolean;
  undoingEntryId?: number | null;
  togglingRowKey: string | null;
  copiedId: string | null;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  formatUtcDateTime: (stamp?: string | null) => string;
  onClearFilters?: () => void;
}

interface TimeSlotGroup {
  timeKey: string;
  displayTime: string;
  minutes: number;
  bookings: ClientActionRow[];
  isNextUp: boolean;
  actionCount: number;
  firstVisitCount: number;
}

const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 99999;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");

  const digits = clean.replace(/[^\d:]/g, "").split(":");
  let hours = parseInt(digits[0], 10) || 0;
  const minutes = parseInt(digits[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const ClientArrivalTimeline: React.FC<ClientArrivalTimelineProps> = ({
  bookings,
  selectedDate,
  todayStr,
  onGoalClick,
  onToggleFollowUp,
  onOpenNoteDrawer,
  onLogMaps,
  onLogBookNext,
  onUndoAction,
  isLoggingAction,
  undoingEntryId,
  togglingRowKey,
  copiedId,
  onCopyId,
  formatUtcDateTime,
  onClearFilters,
}) => {
  const nextUpRef = useRef<HTMLDivElement | null>(null);

  // Slot pagination state: default 5 time slots per page
  const [slotPage, setSlotPage] = useState(1);
  const [slotPageSize, setSlotPageSize] = useState(5);

  // Reset pagination when date changes
  useEffect(() => {
    setSlotPage(1);
  }, [selectedDate]);

  // Group and sort bookings into chronological time slots
  // totalActionsToday
  // nextUpSlotKey
  const { slots } = useMemo(() => {
    const isToday = selectedDate === todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const groupsMap = new Map<string, ClientActionRow[]>();

    bookings.forEach((booking) => {
      const timeKey = booking.booking_start?.trim() || "Unscheduled";
      if (!groupsMap.has(timeKey)) {
        groupsMap.set(timeKey, []);
      }
      groupsMap.get(timeKey)!.push(booking);
    });

    const parsedSlots: TimeSlotGroup[] = Array.from(groupsMap.entries()).map(
      ([timeKey, slotBookings]) => {
        const minutes =
          timeKey === "Unscheduled" ? 99999 : parseTimeToMinutes(timeKey);
        const actionCount = slotBookings.reduce(
          (acc, b) => acc + b.badges.length,
          0
        );
        const firstVisitCount = slotBookings.filter(
          (b) => b.first_visit === true
        ).length;

        const displayTime = timeKey === "Unscheduled" ? "Open Schedule" : timeKey;

        return {
          timeKey,
          displayTime,
          minutes,
          bookings: slotBookings,
          isNextUp: false,
          actionCount,
          firstVisitCount,
        };
      }
    );

    // Sort chronologically
    parsedSlots.sort((a, b) => a.minutes - b.minutes);

    // Find "Next Up" slot if viewing today
    let foundNextUpKey: string | null = null;
    if (isToday && parsedSlots.length > 0) {
      const nextSlot = parsedSlots.find(
        (s) => s.minutes !== 99999 && s.minutes >= currentMinutes - 20
      );
      if (nextSlot) {
        foundNextUpKey = nextSlot.timeKey;
        nextSlot.isNextUp = true;
      } else {
        const lastScheduled = [...parsedSlots]
          .reverse()
          .find((s) => s.minutes !== 99999);
        if (lastScheduled) {
          foundNextUpKey = lastScheduled.timeKey;
          lastScheduled.isNextUp = true;
        }
      }
    }

    const totalActions = bookings.reduce((acc, b) => acc + b.badges.length, 0);

    return {
      slots: parsedSlots,
      nextUpSlotKey: foundNextUpKey,
      totalActionsToday: totalActions,
    };
  }, [bookings, selectedDate, todayStr]);

  // Handle jump button: switches to appropriate page then scrolls
  // const handleScrollToNextUp = () => {
  //   if (nextUpSlotKey && slotPageSize > 0) {
  //     const nextUpIdx = slots.findIndex((s) => s.timeKey === nextUpSlotKey);
  //     if (nextUpIdx >= 0) {
  //       const targetPage = Math.floor(nextUpIdx / slotPageSize) + 1;
  //       if (slotPage !== targetPage) {
  //         setSlotPage(targetPage);
  //       }
  //     }
  //   }
  //   setTimeout(() => {
  //     if (nextUpRef.current) {
  //       nextUpRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  //     }
  //   }, 60);
  // };

  const totalSlotPages =
    slotPageSize === 0 ? 1 : Math.max(1, Math.ceil(slots.length / slotPageSize));
  const validSlotPage = Math.min(Math.max(1, slotPage), totalSlotPages);

  const visibleSlots = useMemo(() => {
    if (slotPageSize === 0 || slotPageSize >= slots.length) {
      return slots;
    }
    const start = (validSlotPage - 1) * slotPageSize;
    return slots.slice(start, start + slotPageSize);
  }, [slots, validSlotPage, slotPageSize]);

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-neutral-tertiary shadow-xs space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-neutral-quaternary flex items-center justify-center text-grey-2 border border-neutral-tertiary">
          <Clock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-black text-dark-1">
            No Client Arrivals Found
          </h3>
          <p className="text-xs text-grey-5 max-w-md mx-auto mt-1">
            No appointments match your active filter or search for this date.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 text-xs font-black text-primary-base bg-primary-base/10 hover:bg-primary-base/20 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls & Quick Navigation Bar */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-neutral-tertiary shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center font-black">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-dark-1 uppercase tracking-wider">
              Chronological Arrival Stream
            </h4>
            <p className="text-[11px] text-grey-5">
              <span>{bookings.length} clients</span>
              <span className="mx-1.5">·</span>
              <span>{slots.length} session time slots</span>
              {totalActionsToday > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  <span className="font-bold text-rose-700">
                    {totalActionsToday} pending action
                    {totalActionsToday === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {nextUpSlotKey && selectedDate === todayStr && (
          <button
            type="button"
            onClick={handleScrollToNextUp}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-primary-base text-white hover:bg-primary-base/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Jump to Next Up ({nextUpSlotKey})</span>
          </button>
        )}
      </div> */}

      {/* Vertical Timeline Track */}
      <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-[19px] sm:before:left-[35px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary-base before:via-neutral-tertiary before:to-neutral-tertiary/40">
        {visibleSlots.map((slot) => {
          const isSlotNextUp = slot.isNextUp;

          return (
            <div
              key={slot.timeKey}
              ref={isSlotNextUp ? nextUpRef : null}
              className="relative space-y-3"
            >
              {/* Timeline Slot Header Node */}
              <div className="flex items-center gap-3">
                {/* Timeline Node Dot / Icon */}
                <div
                  className={`relative z-10 w-8 h-8 -ml-4 sm:-ml-8 rounded-full flex items-center justify-center transition-all ${isSlotNextUp
                      ? "bg-primary-base text-white ring-4 ring-primary-base/20 shadow-md"
                      : "bg-white text-grey-2 border-2 border-neutral-tertiary"
                    }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>

                {/* Time slot banner badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-black tracking-tight bg-neutral-quaternary text-dark-1 border border-neutral-tertiary shadow-2xs">
                    {slot.displayTime}
                  </span>

                  {isSlotNextUp && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-base text-white shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                      <span>Next Up</span>
                    </span>
                  )}

                  <span className="text-xs font-bold text-grey-5">
                    {slot.bookings.length} client
                    {slot.bookings.length === 1 ? "" : "s"}
                  </span>

                  {slot.firstVisitCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-base/10 text-primary-base border border-primary-base/20">
                      {slot.firstVisitCount} First Visit
                      {slot.firstVisitCount === 1 ? "" : "s"}
                    </span>
                  )}

                  {slot.actionCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                      {slot.actionCount} Action
                      {slot.actionCount === 1 ? "" : "s"} Required
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>No Actions Needed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Slot Client Cards Stack */}
              <div className="space-y-2.5 pt-1">
                {slot.bookings.map((booking, idx) => {
                  const key = actionRowKey(booking, idx);
                  const isToggling =
                    togglingRowKey ===
                    (booking.clubready_user_id || booking.booking_id);

                  return (
                    <ClientArrivalCard
                      key={key}
                      row={booking}
                      onGoalClick={onGoalClick}
                      onToggleFollowUp={onToggleFollowUp}
                      onOpenNoteDrawer={onOpenNoteDrawer}
                      onLogMaps={onLogMaps}
                      onLogBookNext={onLogBookNext}
                      onUndoAction={onUndoAction}
                      isLoggingAction={isLoggingAction}
                      undoingEntryId={undoingEntryId}
                      isToggling={isToggling}
                      copiedId={copiedId}
                      onCopyId={onCopyId}
                      formatUtcDateTime={formatUtcDateTime}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Slot Pagination */}
      {slots.length > 4 && (
        <ClientActionsPagination
          currentPage={validSlotPage}
          totalPages={totalSlotPages}
          totalItems={slots.length}
          pageSize={slotPageSize}
          pageSizeOptions={[
            { label: "4 slots / page", value: 4 },
            { label: "5 slots / page", value: 5 },
            { label: "8 slots / page", value: 8 },
            { label: "All slots", value: 0 },
          ]}
          itemLabel="time slots"
          onPageChange={(p) => setSlotPage(p)}
          onPageSizeChange={(sz) => {
            setSlotPageSize(sz);
            setSlotPage(1);
          }}
        />
      )}
    </div>
  );
};
