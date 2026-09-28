import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  MessageSquare,
  Square,
  CheckSquare,
  CheckCircle2,
} from "lucide-react";
import { FollowUp } from "../../service/home";

export interface FollowUpNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string | null;
  clubreadyUserId?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  locationName?: string | null;
  locationId?: string | null;
  cellphone?: string | null;
  intakeReceived?: boolean;
  followUp?: FollowUp | null;
  onToggleFollowUp?: () => void;
  isTogglingFollowUp?: boolean;
  noteText: string;
  onChangeNote: (note: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

const formatApptDateDisplay = (
  dateStr?: string | null,
  timeStr?: string | null
) => {
  if (!dateStr) return timeStr || "N/A";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const base = `${monthNames[monthIndex]} ${day}, ${year}`;
      return timeStr ? `${base}, ${timeStr}` : base;
    }
  } catch {
    // fallback
  }
  return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
};

const formatUtcTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp.endsWith("Z") ? timestamp : timestamp + "Z");
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timestamp;
  }
};

export const FollowUpNoteModal: React.FC<FollowUpNoteModalProps> = ({
  isOpen,
  onClose,
  clientName,
  clubreadyUserId,
  bookingDate,
  bookingTime,
  locationName,
  locationId,
  cellphone,
  intakeReceived = false,
  followUp,
  onToggleFollowUp,
  isTogglingFollowUp = false,
  noteText,
  onChangeNote,
  onSave,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes drawerSlideInFromRight {
          0% { transform: translateX(100%); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes drawerBackdropFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-drawer-slide-in {
          animation: drawerSlideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .animate-backdrop-fade-in {
          animation: drawerBackdropFadeIn 0.22s ease-out forwards !important;
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed inset-0 z-[99998] flex justify-end bg-black/50 backdrop-blur-xs animate-backdrop-fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md h-full shadow-2xl border-l border-neutral-tertiary flex flex-col z-[99999] animate-drawer-slide-in"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-neutral-tertiary bg-neutral-quaternary/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-base/10 text-primary-base flex items-center justify-center font-black border border-primary-base/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-dark-1 text-base">
                  Client Follow-up
                </h3>
                <p className="text-xs text-grey-5 font-mono">
                  {clientName || "First Visit Client"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-grey-2 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* Client Profile Overview Card */}
            <div className="p-4 rounded-2xl bg-neutral-quaternary/50 border border-neutral-tertiary space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-black text-grey-2 uppercase tracking-wider">
                  Visit Summary
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    intakeReceived
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {intakeReceived
                    ? "✓ Intake Completed"
                    : "⚠️ Missing Intake Form"}
                </span>
              </div>

              <div>
                <p className="text-base font-black text-dark-1">
                  {clientName || "Unknown Client"}
                </p>
                {clubreadyUserId && (
                  <p className="text-xs text-grey-5 font-mono">
                    ID #{clubreadyUserId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-neutral-tertiary/60 text-grey-5">
                <div>
                  <span className="text-[10px] text-grey-2 block font-bold">
                    Appt Date & Time
                  </span>
                  <span className="text-dark-1 font-bold">
                    {formatApptDateDisplay(bookingDate, bookingTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-grey-2 block font-bold">
                    Location
                  </span>
                  <span className="text-dark-1 font-bold">
                    {locationName ||
                      (locationId ? `Location #${locationId}` : "Studio")}
                  </span>
                </div>
                {cellphone && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-grey-2 block font-bold">
                      Phone Number
                    </span>
                    <span className="text-dark-1 font-mono">{cellphone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up Checklist Action Card */}
            <div className="p-4 rounded-2xl border border-neutral-tertiary bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-dark-1">
                    Follow-up Status
                  </p>
                  <p className="text-[11px] text-grey-5 font-medium mt-0.5">
                    {followUp?.checked
                      ? `Followed up by ${
                          followUp.checked_by_name || "Desk Staff"
                        }`
                      : "Mark off when client has been reminded or handed the form"}
                  </p>
                </div>

                {onToggleFollowUp && (
                  <button
                    type="button"
                    disabled={isTogglingFollowUp}
                    onClick={onToggleFollowUp}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-70 ${
                      followUp?.checked
                        ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                        : "bg-primary-base text-white shadow-2xs hover:bg-primary-base/90"
                    }`}
                  >
                    {isTogglingFollowUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : followUp?.checked ? (
                      <>
                        <CheckSquare className="w-4 h-4 fill-emerald-100" />
                        <span>Followed Up</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Mark Followed Up</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {followUp?.checked_at && (
                <p className="text-[10px] text-grey-2 font-mono border-t border-neutral-tertiary/40 pt-2">
                  Completed: {formatUtcTimestamp(followUp.checked_at)}
                </p>
              )}
            </div>

            {/* Follow-up Note Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-grey-2 block">
                Follow-up Note & Log Details
              </label>
              <textarea
                value={noteText}
                onChange={(e) => onChangeNote(e.target.value.slice(0, 500))}
                placeholder="e.g. Texted form link at 10am, or client will fill form on arrival..."
                className="w-full h-36 p-3.5 text-xs font-semibold border border-neutral-tertiary rounded-2xl bg-neutral-quaternary/30 text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white focus:ring-2 focus:ring-primary-base/20 transition-all shadow-2xs resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-grey-2 font-mono">
                <span>Max 500 characters</span>
                <span>{noteText.length}/500</span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-neutral-tertiary bg-neutral-quaternary/40 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-grey-5 hover:text-dark-1 hover:bg-neutral-tertiary rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="px-5 py-2 text-xs font-extrabold text-white bg-primary-base hover:bg-primary-base/90 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Note...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
