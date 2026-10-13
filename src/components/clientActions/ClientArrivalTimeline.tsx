import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minimize2,
  Maximize2,
  Check,
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
  isPast: boolean;
  isAllComplete: boolean;
  actionCount: number;
  firstVisitCount: number;
}

const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 99999;
  const clean = timeStr.trim().toUpperCase();

  let timePart = clean;
  if (timePart.includes("T")) {
    timePart = timePart.split("T")[1];
  } else if (timePart.includes("-") && timePart.includes(" ")) {
    timePart = timePart.split(" ")[1];
  }

  const isPM = timePart.includes("PM");
  const isAM = timePart.includes("AM");

  const digits = timePart.replace(/[^\d:]/g, "").split(":");
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
  const quickNavRef = useRef<HTMLDivElement | null>(null);

  // Slot pagination state: default 5 time slots per page
  const [slotPage, setSlotPage] = useState(1);
  const [slotPageSize, setSlotPageSize] = useState(5);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hasAutoScrolledRef = useRef(false);

  // Check whether quick navigation bar can scroll left or right
  const checkScrollability = () => {
    const el = quickNavRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(
        hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      );
    }
  };

  const scrollQuickNav = (direction: "left" | "right") => {
    if (quickNavRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      quickNavRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollability, 300);
    }
  };

  // Focus Mode: Defaults to true. Automatically collapses past slots and completed clients/slots
  const [focusMode, setFocusMode] = useState<boolean>(true);

  // Manual user overrides for slot expand/collapse: Record<slotKey, boolean>
  const [slotOverrides, setSlotOverrides] = useState<Record<string, boolean>>({});

  // Manual user overrides for card expand/collapse: Record<cardKey, boolean>
  const [cardOverrides, setCardOverrides] = useState<Record<string, boolean>>({});

  // Reset pagination, overrides and auto-scroll flag when date changes
  useEffect(() => {
    setSlotPage(1);
    setActiveSlotKey(null);
    hasAutoScrolledRef.current = false;
    setSlotOverrides({});
    setCardOverrides({});
  }, [selectedDate]);

  // Group and sort bookings into chronological time slots
  const { slots, nextUpSlotKey, totalActionsToday } = useMemo(() => {
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

        const isPast =
          isToday && minutes !== 99999 && minutes < currentMinutes;
        const isAllComplete = actionCount === 0;

        return {
          timeKey,
          displayTime,
          minutes,
          bookings: slotBookings,
          isNextUp: false,
          isPast,
          isAllComplete,
          actionCount,
          firstVisitCount,
        };
      }
    );

    // Sort chronologically
    parsedSlots.sort((a, b) => a.minutes - b.minutes);

    // Find "Current / Next Up" slot if viewing today
    let foundNextUpKey: string | null = null;
    if (isToday && parsedSlots.length > 0) {
      const scheduledSlots = parsedSlots.filter((s) => s.minutes !== 99999);
      if (scheduledSlots.length > 0) {
        // Select slot currently in progress (within 30 mins after start) or earliest upcoming slot
        const nextSlot = scheduledSlots.find(
          (s) => s.minutes >= currentMinutes - 30
        );
        if (nextSlot) {
          foundNextUpKey = nextSlot.timeKey;
          nextSlot.isNextUp = true;
        } else {
          const lastScheduled = scheduledSlots[scheduledSlots.length - 1];
          if (lastScheduled) {
            foundNextUpKey = lastScheduled.timeKey;
            lastScheduled.isNextUp = true;
          }
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

  // Check scrollability on slots change or window resize
  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slots]);

  // Collapse evaluation helpers
  const isSlotCollapsed = (slot: TimeSlotGroup): boolean => {
    if (slotOverrides[slot.timeKey] !== undefined) {
      return slotOverrides[slot.timeKey];
    }
    if (!focusMode) return false;
    return slot.isPast || slot.isAllComplete;
  };

  const toggleSlotCollapse = (timeKey: string) => {
    const slot = slots.find((s) => s.timeKey === timeKey);
    if (!slot) return;
    const current = isSlotCollapsed(slot);
    setSlotOverrides((prev) => ({
      ...prev,
      [timeKey]: !current,
    }));
  };

  const isCardCollapsed = (
    booking: ClientActionRow,
    slot: TimeSlotGroup,
    cardKey: string
  ): boolean => {
    if (cardOverrides[cardKey] !== undefined) {
      return cardOverrides[cardKey];
    }
    if (!focusMode) return false;
    const isClientComplete = booking.badges.length === 0;
    return slot.isPast || isClientComplete;
  };

  const toggleCardCollapse = (
    cardKey: string,
    booking: ClientActionRow,
    slot: TimeSlotGroup
  ) => {
    const current = isCardCollapsed(booking, slot, cardKey);
    setCardOverrides((prev) => ({
      ...prev,
      [cardKey]: !current,
    }));
  };

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    setSlotOverrides({});
    setCardOverrides({});
  };

  // Navigate & scroll to any specified slot
  const scrollToSlot = (timeKey: string) => {
    setActiveSlotKey(timeKey);
    // Expand slot when navigated to
    setSlotOverrides((prev) => ({
      ...prev,
      [timeKey]: false,
    }));
    const slotIdx = slots.findIndex((s) => s.timeKey === timeKey);
    if (slotIdx >= 0 && slotPageSize > 0) {
      const targetPage = Math.floor(slotIdx / slotPageSize) + 1;
      if (slotPage !== targetPage) {
        setSlotPage(targetPage);
      }
    }

    // Scroll timeline slot into view
    const safeId = `timeline-slot-${timeKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const executeScroll = () => {
      const el =
        document.getElementById(safeId) ||
        (timeKey === nextUpSlotKey ? nextUpRef.current : null);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    };

    if (!executeScroll()) {
      setTimeout(executeScroll, 120);
      setTimeout(executeScroll, 300);
    }

    // Also center the pill in the quick nav bar
    const pillId = `quick-nav-pill-${timeKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const pillEl = document.getElementById(pillId);
    if (pillEl) {
      pillEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  // Jump to Current / Next Up button
  const handleScrollToNextUp = () => {
    if (nextUpSlotKey) {
      scrollToSlot(nextUpSlotKey);
    }
  };

  // Automatically navigate user to the current time slot on initial view / load of today
  useEffect(() => {
    if (
      selectedDate === todayStr &&
      nextUpSlotKey &&
      !hasAutoScrolledRef.current &&
      slots.length > 0
    ) {
      const slotIdx = slots.findIndex((s) => s.timeKey === nextUpSlotKey);
      if (slotIdx >= 0 && slotPageSize > 0) {
        const targetPage = Math.floor(slotIdx / slotPageSize) + 1;
        if (slotPage !== targetPage) {
          setSlotPage(targetPage);
          return;
        }
      }

      const timer = setTimeout(() => {
        const safeId = `timeline-slot-${nextUpSlotKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const el = document.getElementById(safeId) || nextUpRef.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          hasAutoScrolledRef.current = true;
          setActiveSlotKey(nextUpSlotKey);
        }

        const pillId = `quick-nav-pill-${nextUpSlotKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const pillEl = document.getElementById(pillId);
        if (pillEl) {
          pillEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
        checkScrollability();
      }, 180);

      return () => clearTimeout(timer);
    }
  }, [selectedDate, todayStr, nextUpSlotKey, slotPageSize, slots, slotPage]);

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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-tertiary shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center font-black">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-dark-1 uppercase tracking-wider">
                  Chronological Arrival Stream
                </h4>
                {selectedDate === todayStr && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Schedule</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-grey-5 flex items-center flex-wrap gap-1.5 mt-0.5">
                <span>{bookings.length} clients</span>
                <span>·</span>
                <span>{slots.length} session time slots</span>
                {totalActionsToday > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-rose-700">
                      {totalActionsToday} pending action
                      {totalActionsToday === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* View Mode Toggle: Focus (Auto-collapse) vs All Expanded */}
            <button
              type="button"
              onClick={toggleFocusMode}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${focusMode
                ? "bg-primary-base/10 text-primary-base border-primary-base/30 hover:bg-primary-base/20 font-black"
                : "bg-white text-dark-1 border-neutral-tertiary hover:bg-neutral-quaternary font-bold"
                }`}
              title={
                focusMode
                  ? "Focus Mode: Completed and past time slots are automatically collapsed. Click to expand all."
                  : "All Expanded: All slots and cards are shown open. Click to enable Focus Mode."
              }
            >
              {focusMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Focus: Due Only</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>All Expanded</span>
                </>
              )}
            </button>

            {nextUpSlotKey && selectedDate === todayStr && (
              <button
                type="button"
                onClick={handleScrollToNextUp}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-primary-base text-white hover:bg-primary-base/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Jump to Current ({nextUpSlotKey})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Navigation Bar: Horizontal scrollable time slot pills */}
        {slots.length > 1 && (
          <div className="pt-3 border-t border-neutral-tertiary/70">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-grey-5 uppercase tracking-wider flex items-center gap-1.5">
                <span>Quick Navigation</span>
                <span className="text-grey-4 font-normal">({slots.length} slots)</span>
              </span>
              <span className="text-[10px] text-grey-4 hidden sm:inline">
                Click any slot to jump directly
              </span>
            </div>

            {/* Scrollable slots track flanked by Left and Right navigation chevrons */}
            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollQuickNav("left")}
                disabled={!canScrollLeft}
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${canScrollLeft
                  ? "bg-neutral-quaternary hover:bg-neutral-tertiary text-dark-1 border border-neutral-tertiary shadow-2xs cursor-pointer active:scale-95"
                  : "bg-neutral-quaternary/40 text-grey-3 border border-neutral-tertiary/30 cursor-not-allowed opacity-40"
                  }`}
                title="Scroll slots left"
                aria-label="Scroll slots left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={quickNavRef}
                onScroll={checkScrollability}
                className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scroll-smooth flex-1 min-w-0"
              >
                {slots.map((slot) => {
                  const isCurrent = slot.isNextUp && selectedDate === todayStr;
                  const isSelected = activeSlotKey === slot.timeKey;

                  return (
                    <button
                      key={slot.timeKey}
                      id={`quick-nav-pill-${slot.timeKey.replace(/[^a-zA-Z0-9]/g, "_")}`}
                      type="button"
                      onClick={() => scrollToSlot(slot.timeKey)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                        ? "bg-primary-base text-white shadow-2xs ring-2 ring-primary-base/30"
                        : isCurrent
                          ? "bg-primary-base/15 text-primary-base border border-primary-base/30 font-black hover:bg-primary-base/20"
                          : "bg-neutral-quaternary text-dark-1 hover:bg-neutral-tertiary/70 border border-neutral-tertiary"
                        }`}
                    >
                      <span>{slot.displayTime}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${isSelected
                          ? "bg-white/20 text-white"
                          : isCurrent
                            ? "bg-primary-base text-white"
                            : slot.isAllComplete
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-white text-grey-5 border border-neutral-tertiary"
                          }`}
                      >
                        {slot.bookings.length}
                      </span>
                      {slot.actionCount > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected
                            ? "bg-amber-300"
                            : isCurrent
                              ? "bg-rose-500"
                              : "bg-rose-500"
                            }`}
                          title={`${slot.actionCount} action(s) required`}
                        />
                      )}
                      {isCurrent && !isSelected && (
                        <span className="text-[9px] font-black uppercase text-primary-base bg-primary-base/10 px-1 py-0.2 rounded">
                          Now
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollQuickNav("right")}
                disabled={!canScrollRight}
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${canScrollRight
                  ? "bg-neutral-quaternary hover:bg-neutral-tertiary text-dark-1 border border-neutral-tertiary shadow-2xs cursor-pointer active:scale-95"
                  : "bg-neutral-quaternary/40 text-grey-3 border border-neutral-tertiary/30 cursor-not-allowed opacity-40"
                  }`}
                title="Scroll slots right"
                aria-label="Scroll slots right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vertical Timeline Track */}
      <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-[19px] sm:before:left-[35px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary-base before:via-neutral-tertiary before:to-neutral-tertiary/40">
        {visibleSlots.map((slot) => {
          const isSlotNextUp = slot.isNextUp;
          const isSlotActive = activeSlotKey === slot.timeKey;
          const isCollapsed = isSlotCollapsed(slot);

          return (
            <div
              key={slot.timeKey}
              id={`timeline-slot-${slot.timeKey.replace(/[^a-zA-Z0-9]/g, "_")}`}
              ref={isSlotNextUp ? nextUpRef : null}
              className={`relative space-y-3 transition-all duration-300 scroll-mt-6 ${isSlotActive ? "ring-2 ring-primary-base/20 rounded-2xl p-2 -m-2 bg-primary-base/[0.02]" : ""
                }`}
            >
              {/* Timeline Slot Header Node */}
              <div
                onClick={() => toggleSlotCollapse(slot.timeKey)}
                className="flex items-center gap-3 cursor-pointer group select-none"
                title={isCollapsed ? "Click to expand time slot" : "Click to collapse time slot"}
              >
                {/* Timeline Node Dot / Icon */}
                <div
                  className={`relative z-10 w-8 h-8 -ml-4 sm:-ml-8 rounded-full flex items-center justify-center transition-all ${isSlotNextUp
                    ? "bg-primary-base text-white ring-4 ring-primary-base/20 shadow-md"
                    : slot.isAllComplete
                      ? "bg-emerald-500 text-white border-2 border-emerald-600 shadow-2xs"
                      : "bg-white text-grey-2 border-2 border-neutral-tertiary group-hover:border-primary-base/50"
                    }`}
                >
                  {slot.isAllComplete ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Time slot banner badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-black tracking-tight bg-neutral-quaternary text-dark-1 border border-neutral-tertiary shadow-2xs group-hover:border-primary-base/40 flex items-center gap-1.5 transition-colors">
                    <span>{slot.displayTime}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-grey-4 group-hover:text-dark-1" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-grey-4 group-hover:text-dark-1" />
                    )}
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>All Tasks Complete</span>
                    </span>
                  )}

                  {slot.isPast && (
                    <span className="text-[10px] font-bold text-grey-4 uppercase tracking-wider">
                      (Past)
                    </span>
                  )}
                </div>
              </div>

              {/* Slot Content: Collapsed Summary Strip OR Client Cards Stack */}
              {isCollapsed ? (
                <div
                  onClick={() => toggleSlotCollapse(slot.timeKey)}
                  className="ml-4 sm:ml-8 mt-1 px-3.5 py-2.5 bg-neutral-quaternary/40 hover:bg-neutral-quaternary/80 rounded-xl border border-gray-300 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-bold text-dark-1 shrink-0 text-xs">
                      {slot.bookings.length} {slot.bookings.length === 1 ? "client" : "clients"}:
                    </span>
                    <span className="text-grey-5 truncate text-[11px]">
                      {slot.bookings
                        .map((b) => b.client_name)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-primary-base flex items-center gap-0.5 group-hover:underline">
                      <span>Expand Slot</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                /* Slot Client Cards Stack */
                <div className="space-y-2.5 pt-1">
                  {slot.bookings.map((booking, idx) => {
                    const key = actionRowKey(booking, idx);
                    const cardCollapsed = isCardCollapsed(booking, slot, key);
                    const isToggling =
                      togglingRowKey ===
                      (booking.clubready_user_id || booking.booking_id);

                    return (
                      <ClientArrivalCard
                        key={key}
                        row={booking}
                        isCollapsed={cardCollapsed}
                        onToggleCollapse={() => toggleCardCollapse(key, booking, slot)}
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
              )}
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
