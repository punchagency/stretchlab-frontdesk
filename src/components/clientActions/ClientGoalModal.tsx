import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  MapPin,
  Send,
  Loader2,
  FileText,
  UserCheck,
  History,
  Info,
  FileWarning,
} from "lucide-react";
import {
  getClientGoals,
  addClientGoal,
  Goal,
  GoalEntry,
  GoalSource,
} from "../../service/clientActions";
import { StudioLocation } from "../../service/home";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";

interface ClientGoalModalProps {
  clubreadyUserId: string | null;
  clientName?: string | null;
  locationId?: string;
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: Goal | null;
  locations?: StudioLocation[];
  onSuccess?: () => void;
}

export const ClientGoalModal: React.FC<ClientGoalModalProps> = ({
  clubreadyUserId,
  clientName,
  locationId,
  isOpen,
  onClose,
  initialGoal,
  locations = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [goalText, setGoalText] = useState("");
  const [selectedLocId, setSelectedLocId] = useState<string>(locationId || "");

  useEffect(() => {
    if (locationId) {
      setSelectedLocId(locationId);
    }
  }, [locationId]);

  useEffect(() => {
    if (!isOpen) {
      setGoalText("");
    }
  }, [isOpen]);

  const {
    data: goalsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["frontdesk-client-goals", clubreadyUserId],
    queryFn: () => getClientGoals(clubreadyUserId!),
    enabled: isOpen && Boolean(clubreadyUserId),
    staleTime: 60 * 1000,
  });

  const goalsData = goalsResponse?.data;
  const currentGoal: Goal | null = goalsData?.goal ?? initialGoal ?? null;
  const history: GoalEntry[] = goalsData?.history ?? [];

  const addGoalMutation = useMutation({
    mutationFn: async ({ text, locId }: { text: string; locId?: string }) => {
      if (!clubreadyUserId) throw new Error("No client ID provided");
      return addClientGoal(clubreadyUserId, text.trim(), locId || undefined);
    },
    onSuccess: (res) => {
      renderSuccessToast(
        res?.data?.goal?.update_due === false
          ? "Goal recorded & 90-day timer reset!"
          : "Goal recorded successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["frontdesk-client-actions"] });
      queryClient.invalidateQueries({
        queryKey: ["frontdesk-client-goals", clubreadyUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["frontdesk-home"] });
      setGoalText("");
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to save client goal. Please try again.";
      renderErrorToast(msg);
    },
  });

  if (!isOpen || !clubreadyUserId) return null;

  const formatUtcTimestamp = (stamp?: string | null) => {
    if (!stamp) return "";
    try {
      const d = new Date(stamp.endsWith("Z") ? stamp : stamp + "Z");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return stamp;
    }
  };

  const getSourceBadge = (source?: GoalSource | null) => {
    switch (source) {
      case "note":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <FileText className="w-3 h-3 text-teal-600" />
            Flexologist Note
          </span>
        );
      case "intake":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3 h-3 text-blue-600" />
            Intake Form
          </span>
        );
      case "front_desk":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3 text-purple-600" />
            Front Desk
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirmSameGoal = () => {
    if (!currentGoal?.goal) return;
    addGoalMutation.mutate({
      text: currentGoal.goal,
      locId: selectedLocId,
    });
  };

  const handleSubmitNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;
    addGoalMutation.mutate({
      text: goalText,
      locId: selectedLocId,
    });
  };

  const quickPillGoals = [
    "Improve lower back flexibility & relieve soreness",
    "Hamstring and hip mobility",
    "Neck and shoulder tension relief",
    "Post-workout athletic recovery",
    "Increase overall range of motion",
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-1/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-tertiary animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-primary-base/10 via-primary-base/5 to-transparent border-b border-neutral-tertiary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-base text-white flex items-center justify-center shadow-md shadow-primary-base/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-dark-1">
                  {clientName || "Client Wellness Goal"}
                </h3>
                <span className="text-[11px] font-mono font-bold bg-neutral-quaternary px-2 py-0.5 rounded-md text-grey-5 border border-neutral-tertiary">
                  CR ID: {clubreadyUserId}
                </span>
              </div>
              <p className="text-xs text-grey-5 mt-0.5">
                Front desk goal tracking & 90-day progress check-in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-base animate-spin" />
              <p className="text-xs font-bold text-grey-5">
                Loading goal history...
              </p>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold">
                  Failed to load goal details.
                </span>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs font-bold underline hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Current Goal Section */}
              <div className="bg-neutral-quaternary/40 rounded-2xl p-4 sm:p-5 border border-neutral-tertiary/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-grey-5">
                      Current Goal on File
                    </span>
                    {getSourceBadge(currentGoal?.source)}
                  </div>
                  {currentGoal?.on_file && (
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        currentGoal.update_due
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {currentGoal.update_due ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Update Due ({currentGoal.days_since}d old)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active ({currentGoal.days_since ?? 0}d old)
                        </>
                      )}
                    </span>
                  )}
                </div>

                {currentGoal?.on_file && currentGoal.goal ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-white rounded-xl border border-neutral-tertiary shadow-2xs">
                      <p className="text-sm font-semibold text-dark-1 leading-relaxed italic">
                        "{currentGoal.goal}"
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-grey-2 mt-2 flex-wrap gap-2">
                        {currentGoal.captured_at && (
                          <p>
                            Captured {formatUtcTimestamp(currentGoal.captured_at)}
                          </p>
                        )}
                        {currentGoal.set_at && (
                          <p className="text-grey-5 font-semibold">
                            90-day clock set: {formatUtcTimestamp(currentGoal.set_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Template Goal Warning Banner */}
                    {currentGoal.template && (
                      <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <FileWarning className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-orange-950">
                              Boilerplate Goal Detected
                            </p>
                            <p className="text-xs text-orange-800 font-medium mt-0.5">
                              The flexologist gave these exact words to{" "}
                              <strong>
                                {currentGoal.template_clients ?? 3} other clients
                              </strong>{" "}
                              in the last 180 days. Ask the client for their own personalized wellness goal.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentGoal.update_due && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 font-medium">
                            This goal is 90+ days old. If the client's goal
                            remains the same, click to confirm and restart the
                            90-day clock.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={addGoalMutation.isPending}
                          onClick={handleConfirmSameGoal}
                          className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {addGoalMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Goal Still Same</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-neutral-tertiary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-dark-1">
                        No goal currently on file
                      </p>
                      <p className="text-grey-5">
                        Ask the client about their wellness and stretching
                        objectives and record it below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Record / Update Goal Form */}
              <form onSubmit={handleSubmitNewGoal} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-dark-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-base" />
                    <span>
                      {currentGoal?.on_file ? "Update Goal" : "Record New Goal"}
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      goalText.length > 1000 ? "text-rose-600" : "text-grey-2"
                    }`}
                  >
                    {goalText.length}/1000
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Enter what the client aims to achieve (e.g. pain relief, touch toes, athletic mobility)..."
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-tertiary rounded-xl text-xs sm:text-sm text-dark-1 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all resize-none"
                  />

                  {/* Fast Suggestion Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-grey-5 self-center mr-1">
                      Quick ideas:
                    </span>
                    {quickPillGoals.map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setGoalText((prev) =>
                            prev ? `${prev}; ${pill}` : pill
                          )
                        }
                        className="text-[11px] bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 hover:text-dark-1 font-medium px-2 py-0.5 rounded-lg border border-neutral-tertiary/70 transition-colors cursor-pointer"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-grey-5" />
                    <select
                      value={selectedLocId}
                      onChange={(e) => setSelectedLocId(e.target.value)}
                      className="px-2.5 py-1.5 bg-neutral-quaternary border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all cursor-pointer"
                    >
                      <option value="">Studio Location (Optional)</option>
                      {locations.map((loc) => (
                        <option key={loc.location_id} value={loc.location_id}>
                          {loc.location_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !goalText.trim() ||
                      goalText.length > 1000 ||
                      addGoalMutation.isPending
                    }
                    className="px-4 py-2 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-primary-base/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {addGoalMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Save Goal</span>
                  </button>
                </div>
              </form>

              {/* Goal History Timeline */}
              <div className="border-t border-neutral-tertiary pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-grey-5 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Goal History ({history.length})
                  </span>
                  <span className="text-[11px] text-grey-2">
                    Newest entries first
                  </span>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-grey-2 italic py-2">
                    No previous goal history recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-white rounded-xl border border-neutral-tertiary/70 space-y-1.5 shadow-2xs hover:border-neutral-tertiary transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getSourceBadge(entry.source)}
                            {entry.location_name && (
                              <span className="text-[11px] text-grey-5 flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-grey-2" />
                                {entry.location_name}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-grey-2 font-mono">
                            {formatUtcTimestamp(entry.captured_at)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-dark-1 leading-snug">
                          {entry.goal}
                        </p>

                        {/* Evidence quote if from note */}
                        {entry.source === "note" && entry.evidence && (
                          <div className="p-2 bg-teal-50/50 rounded-lg border border-teal-100 text-[11px] text-teal-800 italic">
                            <span className="font-bold not-italic">
                              From session note:{" "}
                            </span>
                            "{entry.evidence}"
                          </div>
                        )}

                        {entry.captured_by_name && (
                          <p className="text-[10px] text-grey-5">
                            Recorded by:{" "}
                            <span className="font-bold text-dark-1">
                              {entry.captured_by_name}
                            </span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-quaternary/50 border-t border-neutral-tertiary flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-grey-5">
            <Info className="w-3.5 h-3.5 text-primary-base shrink-0" />
            <span>Goals reset their 90-day review period upon each save.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-quaternary text-dark-1 font-bold text-xs rounded-xl border border-neutral-tertiary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
