import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Edit2,
} from "lucide-react";
import { getAbleCareIndividual, AbleCareGetIndividualResponse } from "../../service/ablecare";

interface AbleCareQuickLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIndividualModal: (clubreadyUserId: string, isEdit: boolean, clientName?: string) => void;
}

export const AbleCareQuickLookupModal: React.FC<AbleCareQuickLookupModalProps> = ({
  isOpen,
  onClose,
  onOpenIndividualModal,
}) => {
  const [clientIdInput, setClientIdInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<AbleCareGetIndividualResponse["data"] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      setErrorMsg("Please enter a valid numeric ClubReady Client ID.");
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setSearchResult(null);

    try {
      const res = await getAbleCareIndividual(cleanId);
      if (res.status === "success" && res.data) {
        setSearchResult(res.data);
      } else {
        setErrorMsg("Could not retrieve AbleCare details for this client.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 404) {
        setErrorMsg(
          data?.message ||
            "Client not found at your desk's locations, or this client has no booking record."
        );
      } else if (status === 502) {
        setErrorMsg("AbleCare is not responding right now. Please try again in a few minutes.");
      } else {
        setErrorMsg(data?.message || "Failed to look up client in AbleCare.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenAction = () => {
    if (!searchResult) return;
    const isAdded = Boolean(searchResult.able_care?.added);
    const ind = searchResult.individual;
    const name = ind?.first_name || ind?.last_name
      ? `${ind.first_name || ""} ${ind.last_name || ""}`.trim()
      : `Client #${searchResult.clubready_user_id}`;

    onClose();
    onOpenIndividualModal(searchResult.clubready_user_id, isAdded, name);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-dark-1/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-tertiary overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-tertiary bg-linear-to-r from-primary-base/5 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-dark-1">Quick Look Up by ID</h3>
              <p className="text-xs text-grey-5">Check or add any client by ClubReady ID</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleLookup} className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-dark-1 block">
              ClubReady Client ID
            </label>
            <div className="relative">
              <input
                type="text"
                pattern="[0-9]*"
                placeholder="e.g. 66164705"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl text-xs font-bold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !clientIdInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Look Up"}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Result Card */}
          {searchResult && (
            <div className="p-4 rounded-2xl border border-neutral-tertiary bg-neutral-quaternary/20 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-dark-1 text-sm">
                    {searchResult.individual?.first_name || searchResult.individual?.last_name
                      ? `${searchResult.individual.first_name || ""} ${searchResult.individual.last_name || ""}`.trim()
                      : `Client #${searchResult.clubready_user_id}`}
                  </h4>
                  <p className="text-[11px] font-mono text-grey-5">
                    ClubReady ID: #{searchResult.clubready_user_id}
                  </p>
                </div>

                {searchResult.able_care?.added ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    On AbleCare
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    Not Added
                  </span>
                )}
              </div>

              {searchResult.able_care?.facility_name && (
                <div className="text-xs text-grey-5">
                  <strong>Facility:</strong> {searchResult.able_care.facility_name}
                </div>
              )}

              {searchResult.able_care?.added && (
                <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  This client is already registered in AbleCare. You can edit their details if needed.
                </p>
              )}

              <button
                type="button"
                onClick={handleOpenAction}
                className="w-full py-2 px-3 rounded-xl bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {searchResult.able_care?.added ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit AbleCare Details</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to AbleCare</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
