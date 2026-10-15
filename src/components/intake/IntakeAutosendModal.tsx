import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  X,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { Switch } from "../ui/switch";
import {
  getIntakeAutosendSettings,
  saveIntakeAutosendSettings,
  LocationIntakeAutosend,
  SaveIntakeAutosendPayload,
} from "../../service/home";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IntakeAutosendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationEditorState {
  enabled: boolean;
  emails: string[];
  inputEmail: string;
  invalidEmails: string[];
  isDirty: boolean;
}

export const IntakeAutosendModal: React.FC<IntakeAutosendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editorState, setEditorState] = useState<Record<string, LocationEditorState>>({});
  const [activeSavingId, setActiveSavingId] = useState<string | null>(null);

  const {
    data: settingsResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["frontdesk-intake-autosend"],
    queryFn: async () => {
      const res = await getIntakeAutosendSettings();
      return res;
    },
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const locations = settingsResponse?.data || [];
  const maxEmails = settingsResponse?.max_emails || 20;

  // Sync editor state from fetched locations
  useEffect(() => {
    if (locations.length > 0) {
      setEditorState((prev) => {
        const next: Record<string, LocationEditorState> = { ...prev };
        locations.forEach((loc) => {
          if (!next[loc.location_id] || !next[loc.location_id].isDirty) {
            next[loc.location_id] = {
              enabled: loc.enabled,
              emails: loc.emails || [],
              inputEmail: "",
              invalidEmails: [],
              isDirty: false,
            };
          }
        });
        return next;
      });
    }
  }, [locations]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async (payload: SaveIntakeAutosendPayload) => {
      const res = await saveIntakeAutosendSettings(payload);
      return res;
    },
    onSuccess: (data) => {
      const updated = data.data;
      renderSuccessToast(data.message || "Auto-send settings updated");
      queryClient.setQueryData(
        ["frontdesk-intake-autosend"],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((l: LocationIntakeAutosend) =>
              l.location_id === updated.location_id ? updated : l
            ),
          };
        }
      );
      setEditorState((prev) => ({
        ...prev,
        [updated.location_id]: {
          enabled: updated.enabled,
          emails: updated.emails || [],
          inputEmail: "",
          invalidEmails: [],
          isDirty: false,
        },
      }));
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data?.message || "Failed to update auto-send settings";
      renderErrorToast(msg);

      if (data?.invalid && activeSavingId) {
        const invalidList = Array.isArray(data.invalid) ? data.invalid : [data.invalid];
        setEditorState((prev) => {
          const current = prev[activeSavingId];
          if (!current) return prev;
          return {
            ...prev,
            [activeSavingId]: {
              ...current,
              invalidEmails: invalidList,
            },
          };
        });
      }
    },
    onSettled: () => {
      setActiveSavingId(null);
    },
  });

  const handleToggle = async (loc: LocationIntakeAutosend, nextEnabled: boolean) => {
    const locId = loc.location_id;
    const current = editorState[locId] || {
      enabled: loc.enabled,
      emails: loc.emails || [],
      inputEmail: "",
      invalidEmails: [],
      isDirty: false,
    };

    // If turning ON: Check if team inbox is null and no emails exist
    if (nextEnabled && !loc.team_email && current.emails.length === 0) {
      renderErrorToast(
        "This location has no team inbox. Please add at least one recipient email address first."
      );
      return;
    }

    // If toggling OFF, save immediately (backend preserves dormant emails list)
    if (!nextEnabled) {
      setEditorState((prev) => ({
        ...prev,
        [locId]: {
          ...current,
          enabled: false,
          isDirty: false,
        },
      }));
      setActiveSavingId(locId);
      saveMutation.mutate({
        location_id: locId,
        enabled: false,
      });
      return;
    }

    // If toggling ON without other unsaved email edits, save immediately
    if (nextEnabled && !current.isDirty) {
      setEditorState((prev) => ({
        ...prev,
        [locId]: {
          ...current,
          enabled: true,
          isDirty: false,
        },
      }));
      setActiveSavingId(locId);
      saveMutation.mutate({
        location_id: locId,
        enabled: true,
        emails: current.emails,
      });
      return;
    }

    // Otherwise mark state as dirty
    setEditorState((prev) => ({
      ...prev,
      [locId]: {
        ...current,
        enabled: nextEnabled,
        isDirty: true,
      },
    }));
  };

  const handleAddEmails = (locId: string) => {
    const current = editorState[locId];
    if (!current || !current.inputEmail.trim()) return;

    const rawTokens = current.inputEmail
      .split(/[,;\s\n]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (rawTokens.length === 0) return;

    const newValidEmails: string[] = [];
    const invalidFormat: string[] = [];

    rawTokens.forEach((token) => {
      if (EMAIL_REGEX.test(token)) {
        if (
          !current.emails.includes(token) &&
          !newValidEmails.includes(token)
        ) {
          newValidEmails.push(token);
        }
      } else {
        invalidFormat.push(token);
      }
    });

    if (invalidFormat.length > 0) {
      renderErrorToast(`Invalid email format: ${invalidFormat.slice(0, 3).join(", ")}`);
    }

    const availableSlots = maxEmails - current.emails.length;
    if (newValidEmails.length > availableSlots) {
      renderErrorToast(`Cannot add all emails: maximum limit is ${maxEmails} recipients.`);
    }

    const emailsToAdd = newValidEmails.slice(0, Math.max(0, availableSlots));
    if (emailsToAdd.length === 0) return;

    setEditorState((prev) => ({
      ...prev,
      [locId]: {
        ...current,
        emails: [...current.emails, ...emailsToAdd],
        inputEmail: "",
        invalidEmails: current.invalidEmails.filter((e) => !emailsToAdd.includes(e)),
        isDirty: true,
      },
    }));
  };

  const handleRemoveEmail = (locId: string, emailToRemove: string) => {
    const current = editorState[locId];
    if (!current) return;

    setEditorState((prev) => ({
      ...prev,
      [locId]: {
        ...current,
        emails: current.emails.filter((e) => e !== emailToRemove),
        invalidEmails: current.invalidEmails.filter((e) => e !== emailToRemove),
        isDirty: true,
      },
    }));
  };

  const handleRevert = (loc: LocationIntakeAutosend) => {
    setEditorState((prev) => ({
      ...prev,
      [loc.location_id]: {
        enabled: loc.enabled,
        emails: loc.emails || [],
        inputEmail: "",
        invalidEmails: [],
        isDirty: false,
      },
    }));
  };

  const handleSaveLocation = (loc: LocationIntakeAutosend) => {
    const locId = loc.location_id;
    const current = editorState[locId];
    if (!current) return;

    if (current.enabled && !loc.team_email && current.emails.length === 0) {
      renderErrorToast(
        "This location has no team inbox. Please add at least one recipient email address first."
      );
      return;
    }

    setActiveSavingId(locId);
    saveMutation.mutate({
      location_id: locId,
      enabled: current.enabled,
      emails: current.emails,
    });
  };

  if (!isOpen) return null;

  const filteredLocations = locations.filter((loc) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      loc.location_name.toLowerCase().includes(q) ||
      String(loc.location_id).toLowerCase().includes(q) ||
      (loc.team_email && loc.team_email.toLowerCase().includes(q))
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-neutral-tertiary flex flex-col max-h-[92vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-tertiary/60 flex items-center justify-between bg-neutral-quaternary/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary-base text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-dark-1 text-base sm:text-lg">
                  Intake Auto-Send Settings
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-base/10 text-primary-base border border-primary-base/20">
                  Automated Dispatch
                </span>
              </div>
              <p className="text-xs text-grey-5 mt-0.5 font-medium">
                Configure automatic emailing of client intake submissions and AI summaries upon client submission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
              title="Refresh settings"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-primary-base" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="px-6 py-3.5 bg-neutral-quaternary/20 border-b border-neutral-tertiary/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-grey-2" />
            <input
              type="text"
              placeholder="Search studio location or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-grey-5 font-semibold">
            <Building2 className="w-4 h-4 text-primary-base" />
            <span>
              {locations.filter((l) => l.enabled).length} of {locations.length} studios active
            </span>
          </div>
        </div>

        {/* Modal Body / Locations List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-grey-5">
              <Loader2 className="w-8 h-8 animate-spin text-primary-base" />
              <p className="text-xs font-medium">Loading auto-send configurations...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-grey-2 mx-auto" />
              <p className="text-sm font-bold text-dark-1">No studio locations found</p>
              <p className="text-xs text-grey-5">
                {search ? "Try refining your search keyword" : "No locations assigned to your account."}
              </p>
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const state = editorState[loc.location_id] || {
                enabled: loc.enabled,
                emails: loc.emails || [],
                inputEmail: "",
                invalidEmails: [],
                isDirty: false,
              };
              const isSavingThis = activeSavingId === loc.location_id;

              return (
                <div
                  key={loc.location_id}
                  className={`p-5 rounded-2xl border transition-all ${
                    state.enabled
                      ? "border-primary-base/30 bg-primary-base/[0.015] shadow-xs"
                      : "border-neutral-tertiary bg-white"
                  }`}
                >
                  {/* Top Bar of Location Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-tertiary/60">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          state.enabled
                            ? "bg-primary-base/10 text-primary-base"
                            : "bg-neutral-quaternary text-grey-2"
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-dark-1">
                            {loc.location_name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-grey-5 bg-neutral-quaternary px-2 py-0.5 rounded-md border border-neutral-tertiary">
                            ID: {loc.location_id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              state.enabled
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-neutral-quaternary text-grey-5 border border-neutral-tertiary"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                state.enabled ? "bg-emerald-500 animate-pulse" : "bg-grey-2"
                              }`}
                            />
                            {state.enabled ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-xs font-bold text-dark-1">
                        {state.enabled ? "Enabled" : "Off"}
                      </span>
                      <Switch
                        checked={state.enabled}
                        onCheckedChange={(checked) => handleToggle(loc, checked)}
                        disabled={isSavingThis}
                      />
                    </div>
                  </div>

                  {/* Studio Inbox Banner */}
                  <div className="mt-4">
                    {loc.team_email ? (
                      <div className="flex items-center gap-2 text-xs text-grey-5 bg-neutral-quaternary/40 px-3.5 py-2.5 rounded-xl border border-neutral-tertiary/60">
                        <Mail className="w-4 h-4 text-primary-base shrink-0" />
                        <span>
                          Studio Team Inbox:{" "}
                          <strong className="text-dark-1 font-semibold font-mono">
                            {loc.team_email}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">No studio team mailbox configured</p>
                          <p className="text-[11px] text-amber-700 mt-0.5">
                            At least one recipient email address below is required to enable auto-send for this studio.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Recipients Section */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-dark-1 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-primary-base" />
                        Additional Recipients ({state.emails.length}/{maxEmails})
                      </span>
                      <span className="text-[11px] text-grey-5">
                        Copies sent on each new submission
                      </span>
                    </div>

                    {/* Chips Display */}
                    {state.emails.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-quaternary/20 border border-neutral-tertiary/60 rounded-xl max-h-36 overflow-y-auto">
                        {state.emails.map((email) => {
                          const isInvalid = state.invalidEmails.includes(email);
                          return (
                            <span
                              key={email}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                isInvalid
                                  ? "bg-red-50 text-red-700 border border-red-300"
                                  : "bg-white text-dark-1 border border-neutral-tertiary shadow-2xs"
                              }`}
                            >
                              <span className="font-mono text-[11px]">{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(loc.location_id, email)}
                                className="text-grey-2 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                                title="Remove recipient"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Email Input Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          placeholder={
                            state.emails.length >= maxEmails
                              ? `Maximum limit reached (${maxEmails})`
                              : "Enter recipient email (or paste multiple separated by commas)..."
                          }
                          disabled={state.emails.length >= maxEmails || isSavingThis}
                          value={state.inputEmail}
                          onChange={(e) =>
                            setEditorState((prev) => ({
                              ...prev,
                              [loc.location_id]: {
                                ...state,
                                inputEmail: e.target.value,
                              },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddEmails(loc.location_id);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-neutral-tertiary rounded-xl text-xs font-medium text-dark-1 focus:outline-none focus:border-primary-base disabled:opacity-50 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddEmails(loc.location_id)}
                        disabled={
                          !state.inputEmail.trim() ||
                          state.emails.length >= maxEmails ||
                          isSavingThis
                        }
                        className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-bold text-xs rounded-xl border border-neutral-tertiary transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions / Save Footer if Dirty */}
                  {state.isDirty && (
                    <div className="mt-4 pt-3 border-t border-neutral-tertiary/60 flex items-center justify-between gap-3 bg-primary-base/[0.03] -mx-5 -mb-5 p-4 rounded-b-2xl">
                      <p className="text-xs font-semibold text-primary-base flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Unsaved changes for this location
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRevert(loc)}
                          disabled={isSavingThis}
                          className="px-3 py-1.5 text-xs font-bold text-grey-5 hover:text-dark-1 cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveLocation(loc)}
                          disabled={isSavingThis}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSavingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Changes</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-tertiary/60 bg-neutral-quaternary/30 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-grey-5">
            Auto-send delivers the formatted intake submission and full AI summary as soon as a client submits the form.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-extrabold text-xs rounded-xl border border-neutral-tertiary transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
