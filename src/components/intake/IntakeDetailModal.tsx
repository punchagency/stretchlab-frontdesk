import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { IntakeSubmission } from "../../service/home";

interface IntakeDetailModalProps {
  submission: IntakeSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onSendPeople: (sub: IntakeSubmission) => void;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export const IntakeDetailModal: React.FC<IntakeDetailModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSendPeople,
}) => {
  if (!isOpen || !submission) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-white rounded-3xl border border-neutral-tertiary shadow-2xl w-full max-w-xl overflow-hidden space-y-4 my-auto relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-tertiary flex justify-between items-center bg-neutral-quaternary/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-base text-white flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-dark-1 text-base">
                Intake Submission Details
              </h3>
              <p className="text-xs text-grey-5 font-mono">
                Submission #{submission.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs font-semibold text-grey-5">
          {/* Matched Pair or Unmatched Banner */}
          {submission.first_timer ? (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Matched Client
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                  Matched by ID #{submission.submitter_id || submission.first_timer.clubready_user_id || submission.first_timer.customer_id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Booking profile */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-grey-2 uppercase block">
                    1. Booking Profile
                  </span>
                  <p className="font-black text-dark-1 text-sm">
                    {submission.first_timer.client_name || "N/A"}
                  </p>
                  <p className="text-[11px] text-grey-5 font-mono">
                    Member ID #{submission.first_timer.clubready_user_id || submission.first_timer.customer_id || submission.first_timer.id}
                  </p>
                  <p className="text-[11px] text-grey-5">
                    Appt: {submission.first_timer.appointment_date || submission.first_timer.booking_date || "N/A"}{" "}
                    {submission.first_timer.booking_time ? `@ ${submission.first_timer.booking_time}` : ""}
                  </p>
                  <p className="text-[11px] text-grey-5">
                    Flexologist: {submission.first_timer.instructor || submission.first_timer.flexologist_name || "N/A"}
                  </p>
                </div>

                {/* Submitter */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-grey-2 uppercase block">
                    2. Intake Submitter
                  </span>
                  <p className="font-black text-dark-1 text-sm">
                    {submission.client_name || "N/A"}
                  </p>
                  <p className="text-[11px] text-grey-5 font-mono">
                    Submitter ID #{submission.submitter_id}
                  </p>
                  <p className="text-[11px] text-grey-5">
                    Submitted: {formatDate(submission.submitted_at)}
                  </p>
                  <p className="text-[11px] text-grey-5 font-mono">
                    Form ID #{submission.form_id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs">
                  Not matched to an appointment yet
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                Unmatched
              </span>
            </div>
          )}

          {/* Key Facts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-neutral-quaternary/30 rounded-2xl border border-neutral-tertiary/60 space-y-1">
              <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                Client Name
              </span>
              <p className="font-black text-dark-1 text-sm truncate">
                {submission.client_name || "N/A"}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-quaternary/30 rounded-2xl border border-neutral-tertiary/60 space-y-1">
              <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                Studio Location
              </span>
              <p className="font-black text-dark-1 text-sm truncate">
                {submission.location_name || `Location #${submission.location_id}`}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-quaternary/30 rounded-2xl border border-neutral-tertiary/60 space-y-1">
              <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                Submitted At
              </span>
              <p className="font-bold text-dark-1 text-xs">
                {formatDate(submission.submitted_at)}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-quaternary/30 rounded-2xl border border-neutral-tertiary/60 space-y-1">
              <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                Task Status
              </span>
              <p className="font-bold text-dark-1 text-xs uppercase">
                {submission.task_status || "SUBMITTED"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-tertiary bg-neutral-quaternary/30 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-neutral-quaternary text-dark-1 font-bold text-xs rounded-xl border border-neutral-tertiary transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSendPeople(submission);
            }}
            className="px-5 py-2.5 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-primary-base/20 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send to People / Studio</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
