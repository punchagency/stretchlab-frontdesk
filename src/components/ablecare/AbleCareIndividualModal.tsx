import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  HeartPulse,
  User,
  Calendar,
  Ruler,
  Hand,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  addOrUpdateAbleCareIndividual,
  getAbleCareIndividual,
  AbleCareBadgeStatus,
  AbleCareGetIndividualResponse,
  AbleCareIndividualPayload,
  parseAbleCareError,
  feetInchesToCm,
  cmToFeetInches,
} from "../../service/ablecare";
import {
  getDeskStaff,
  DeskStaffMember,
  ClientActionsResponse,
} from "../../service/clientActions";
import { renderSuccessToast } from "../../utils/toast";
import { getUserInfo } from "../../utils/user";

interface AbleCareIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubreadyUserId: string | number | null;
  clientName?: string | null;
  locationName?: string | null;
  isEditMode?: boolean;
  onSuccess?: () => void;
}

export const AbleCareIndividualModal: React.FC<AbleCareIndividualModalProps> = ({
  isOpen,
  onClose,
  clubreadyUserId,
  clientName,
  locationName,
  isEditMode = false,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Form State
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [sexAtBirth, setSexAtBirth] = useState<string>("");
  const [dominantHand, setDominantHand] = useState<"RIGHT" | "LEFT">("RIGHT");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft_in">("ft_in");
  const [heightCm, setHeightCm] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");

  // Error & Status State
  const [errorBanner, setErrorBanner] = useState<{
    type: "error" | "warning";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Query desk staff to match logged-in user
  const { data: deskStaffResponse } = useQuery({
    queryKey: ["frontdesk-staff"],
    queryFn: () => getDeskStaff(),
    staleTime: 5 * 60 * 1000,
  });

  const staffList: DeskStaffMember[] = deskStaffResponse?.data?.staff || [];
  const defaultStaffId = deskStaffResponse?.data?.default_staff_id ?? null;

  // Automatically determine staff_id from logged-in user session
  const loggedInStaffId = useMemo<number | null>(() => {
    const userInfo = getUserInfo();
    const email = userInfo?.email?.toLowerCase().trim() || "";
    const username = userInfo?.username?.toLowerCase().trim() || "";
    const name = userInfo?.name?.toLowerCase().trim() || "";

    if (defaultStaffId) {
      const found = staffList.find((s) => s.id === defaultStaffId);
      if (found) return found.id;
    }

    if (email || username || name) {
      const found = staffList.find((s) => {
        const sEmail = s.email?.toLowerCase().trim();
        const sName = s.name?.toLowerCase().trim();
        return (
          (email && (sEmail === email || sName === email)) ||
          (username && (sEmail === username || sName === username)) ||
          (name && (sEmail === name || sName === name))
        );
      });
      if (found) return found.id;
    }

    return defaultStaffId;
  }, [staffList, defaultStaffId]);

  // Query live AbleCare individual if in edit mode
  const {
    data: individualResponse,
    isLoading: isFetchingIndividual,
  } = useQuery({
    queryKey: ["ablecare-individual", clubreadyUserId],
    queryFn: () => getAbleCareIndividual(clubreadyUserId!),
    enabled: isOpen && Boolean(clubreadyUserId) && isEditMode,
    staleTime: 30 * 1000,
  });

  // Today string for max date of birth
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  // Pre-fill form when in edit mode or when individual is fetched
  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setDateOfBirth("");
      setSexAtBirth("");
      setDominantHand("RIGHT");
      setHeightUnit("ft_in");
      setHeightCm("");
      setHeightFeet("");
      setHeightInches("");
      setErrorBanner(null);
      setFieldErrors({});
      return;
    }

    if (isEditMode && individualResponse?.data?.individual) {
      const ind = individualResponse.data.individual;
      if (ind.date_of_birth) {
        setDateOfBirth(ind.date_of_birth);
      }
      if (ind.sex_at_birth) {
        setSexAtBirth(ind.sex_at_birth.toUpperCase());
      }
      if (ind.dominant_hand) {
        setDominantHand(ind.dominant_hand.toUpperCase() === "LEFT" ? "LEFT" : "RIGHT");
      }
      if (ind.height) {
        setHeightCm(String(Math.round(ind.height)));
        const { feet, inches } = cmToFeetInches(ind.height);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
      }
    }
  }, [isOpen, isEditMode, individualResponse, defaultStaffId]);

  // Sync unit conversion
  const handleHeightUnitToggle = (unit: "cm" | "ft_in") => {
    setHeightUnit(unit);
    if (unit === "cm") {
      if (heightFeet || heightInches) {
        const cm = feetInchesToCm(Number(heightFeet) || 0, Number(heightInches) || 0);
        if (cm > 0) setHeightCm(String(cm));
      }
    } else {
      if (heightCm) {
        const { feet, inches } = cmToFeetInches(Number(heightCm) || 0);
        if (feet > 0) {
          setHeightFeet(String(feet));
          setHeightInches(String(inches));
        }
      }
    }
  };

  const updateBookingAbleCareCaches = (
    targetUserId: string,
    nextAbleCare: AbleCareBadgeStatus,
    isOptimistic: boolean
  ) => {
    const updater = (old: ClientActionsResponse | undefined) => {
      if (!old?.data?.bookings) return old;
      let changed = false;
      const bookings = old.data.bookings.map((row) => {
        if (
          row.clubready_user_id != null &&
          String(row.clubready_user_id) === targetUserId
        ) {
          changed = true;
          const mergedAbleCare: AbleCareBadgeStatus = isOptimistic
            ? {
                ...(row.able_care || {}),
                ...nextAbleCare,
                facility_name:
                  row.able_care?.facility_name ||
                  nextAbleCare.facility_name ||
                  locationName ||
                  undefined,
                added_at: row.able_care?.added_at || nextAbleCare.added_at,
                staff_name: nextAbleCare.staff_name ?? row.able_care?.staff_name,
              }
            : nextAbleCare;
          return { ...row, able_care: mergedAbleCare };
        }
        return row;
      });
      return changed ? { ...old, data: { ...old.data, bookings } } : old;
    };

    queryClient.setQueriesData<ClientActionsResponse>(
      { queryKey: ["client-actions"] },
      updater
    );
    queryClient.setQueriesData<ClientActionsResponse>(
      { queryKey: ["frontdesk-client-actions"] },
      updater
    );
  };

  // Mutation for Add / Edit
  const saveMutation = useMutation({
    mutationFn: async (payload: AbleCareIndividualPayload) => {
      return await addOrUpdateAbleCareIndividual(payload);
    },
    onMutate: async (payload) => {
      const targetUserId = String(payload.clubready_user_id).trim();

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["client-actions"] }),
        queryClient.cancelQueries({ queryKey: ["frontdesk-client-actions"] }),
        queryClient.cancelQueries({
          queryKey: ["ablecare-individual", clubreadyUserId],
        }),
      ]);

      const previousClientActions =
        queryClient.getQueriesData<ClientActionsResponse>({
          queryKey: ["client-actions"],
        });
      const previousFrontdeskClientActions =
        queryClient.getQueriesData<ClientActionsResponse>({
          queryKey: ["frontdesk-client-actions"],
        });
      const previousIndividual =
        queryClient.getQueryData<AbleCareGetIndividualResponse>([
          "ablecare-individual",
          clubreadyUserId,
        ]);

      const targetStaffId = payload.staff_id ?? loggedInStaffId ?? null;
      const staffMember = staffList.find((s) => s.id === targetStaffId);
      const userInfo = getUserInfo();
      const staffName =
        staffMember?.name ||
        staffMember?.email ||
        userInfo?.name ||
        userInfo?.email ||
        null;

      const optimisticAbleCare: AbleCareBadgeStatus = {
        added: true,
        facility_name:
          previousIndividual?.data?.able_care?.facility_name ||
          locationName ||
          undefined,
        added_at:
          previousIndividual?.data?.able_care?.added_at ||
          new Date().toISOString(),
        staff_id: targetStaffId,
        staff_name: staffName,
      };

      updateBookingAbleCareCaches(targetUserId, optimisticAbleCare, true);

      if (previousIndividual?.data) {
        queryClient.setQueryData<AbleCareGetIndividualResponse>(
          ["ablecare-individual", clubreadyUserId],
          {
            ...previousIndividual,
            data: {
              ...previousIndividual.data,
              able_care: {
                ...previousIndividual.data.able_care,
                ...optimisticAbleCare,
              },
              individual: previousIndividual.data.individual
                ? {
                    ...previousIndividual.data.individual,
                    ...(payload.date_of_birth !== undefined && {
                      date_of_birth: payload.date_of_birth,
                    }),
                    ...(payload.sex_at_birth !== undefined && {
                      sex_at_birth: payload.sex_at_birth,
                    }),
                    ...(payload.dominant_hand !== undefined && {
                      dominant_hand: payload.dominant_hand,
                    }),
                    ...(payload.height !== undefined && {
                      height: payload.height,
                    }),
                  }
                : previousIndividual.data.individual,
            },
          }
        );
      }

      return {
        previousClientActions,
        previousFrontdeskClientActions,
        previousIndividual,
      };
    },
    onSuccess: (res, payload) => {
      const targetUserId = String(
        res.data?.clubready_user_id || payload.clubready_user_id
      ).trim();

      if (res.data?.able_care) {
        updateBookingAbleCareCaches(targetUserId, res.data.able_care, false);
        queryClient.setQueryData<AbleCareGetIndividualResponse>(
          ["ablecare-individual", clubreadyUserId],
          (old) => ({
            status: "success",
            data: {
              clubready_user_id: targetUserId,
              able_care: res.data.able_care,
              individual:
                res.data.individual ?? old?.data?.individual ?? null,
            },
          })
        );
      }

      const already = res.data?.already_added;
      const clientMsg = already
        ? "AbleCare details updated successfully."
        : "Client added to AbleCare successfully!";
      renderSuccessToast(clientMsg);

      // Invalidate relevant queries in the background to stay in sync with server
      queryClient.invalidateQueries({ queryKey: ["client-actions"] });
      queryClient.invalidateQueries({ queryKey: ["frontdesk-client-actions"] });
      queryClient.invalidateQueries({ queryKey: ["ablecare-individual", clubreadyUserId] });
      queryClient.invalidateQueries({ queryKey: ["frontdesk-home"] });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    },
    onError: (err: any, _payload, context) => {
      if (context?.previousClientActions) {
        context.previousClientActions.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousFrontdeskClientActions) {
        context.previousFrontdeskClientActions.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousIndividual !== undefined) {
        queryClient.setQueryData(
          ["ablecare-individual", clubreadyUserId],
          context.previousIndividual
        );
      }

      const parsed = parseAbleCareError(err);
      if (parsed.isConflict) {
        setErrorBanner({
          type: "warning",
          message: parsed.message,
        });
      } else {
        setErrorBanner({
          type: "error",
          message: parsed.message,
        });
      }

      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubreadyUserId) {
      setErrorBanner({
        type: "error",
        message: "A numeric ClubReady User ID is required.",
      });
      return;
    }

    setErrorBanner(null);
    setFieldErrors({});

    // Calculate final height in cm
    let finalCm: number | null = null;
    if (heightUnit === "cm") {
      if (heightCm.trim()) {
        finalCm = Math.round(Number(heightCm));
      }
    } else {
      if (heightFeet.trim() || heightInches.trim()) {
        finalCm = feetInchesToCm(Number(heightFeet) || 0, Number(heightInches) || 0);
      }
    }

    // Client-side height validation check
    if (finalCm !== null && (finalCm < 90 || finalCm > 250)) {
      setFieldErrors({
        height: "Height must be between 90 and 250 cm (approx 2'11\" to 8'2\").",
      });
      return;
    }

    const payload: AbleCareIndividualPayload = {
      clubready_user_id: clubreadyUserId,
      dominant_hand: dominantHand,
    };

    if (dateOfBirth.trim()) {
      payload.date_of_birth = dateOfBirth.trim();
    }
    if (sexAtBirth.trim()) {
      payload.sex_at_birth = sexAtBirth.trim();
    }
    if (finalCm !== null && finalCm > 0) {
      payload.height = finalCm;
    }
    if (loggedInStaffId) {
      payload.staff_id = loggedInStaffId;
    }

    saveMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-dark-1/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-tertiary overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 sm:p-7 border-b border-neutral-tertiary bg-linear-to-r from-primary-base/5 via-white to-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-base/10 text-primary-base border border-primary-base/20">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{isEditMode ? "Edit AbleCare Details" : "Add to AbleCare"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-dark-1 tracking-tight">
              {clientName || "Client Profile"}
            </h2>
            <div className="flex items-center gap-3 text-xs text-grey-5 font-semibold flex-wrap">
              <span>
                ClubReady ID: <strong className="text-dark-1 font-mono">#{clubreadyUserId}</strong>
              </span>
              {locationName && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-grey-2" />
                    <span>{locationName}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Informative helper note */}
          <div className="p-4 rounded-2xl bg-neutral-quaternary/40 border border-neutral-tertiary/70 text-xs text-grey-5 leading-relaxed space-y-1">
            <p className="font-extrabold text-dark-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary-base" />
              Automated Facility & Profile Linking
            </p>
            <p>
              AbleCare automatically maps this client to the facility for{" "}
              <strong>{locationName || "their booked location"}</strong>. Date of birth and sex are
              auto-filled from the ClubReady member list when available.
            </p>
          </div>

          {/* Loading Indicator when pre-fetching live individual details */}
          {isFetchingIndividual && (
            <div className="flex items-center justify-center p-6 gap-2 text-xs font-bold text-primary-base bg-primary-base/5 rounded-2xl border border-primary-base/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching live AbleCare profile details...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorBanner && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-150 ${
                errorBanner.type === "warning"
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-red-50 text-red-900 border-red-300"
              }`}
            >
              {errorBanner.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{errorBanner.message}</div>
            </div>
          )}

          {/* Form */}
          <form id="ablecare-individual-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Height Field with cm / ft+in switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-dark-1 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-primary-base" />
                  <span>Height</span>
                </label>

                {/* Unit Toggle */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-quaternary border border-neutral-tertiary text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => handleHeightUnitToggle("ft_in")}
                    className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      heightUnit === "ft_in"
                        ? "bg-white text-dark-1 shadow-2xs"
                        : "text-grey-5 hover:text-dark-1"
                    }`}
                  >
                    ft / in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeightUnitToggle("cm")}
                    className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      heightUnit === "cm"
                        ? "bg-white text-dark-1 shadow-2xs"
                        : "text-grey-5 hover:text-dark-1"
                    }`}
                  >
                    cm
                  </button>
                </div>
              </div>

              {heightUnit === "cm" ? (
                <div className="relative">
                  <input
                    type="number"
                    min="90"
                    max="250"
                    step="1"
                    placeholder="e.g. 175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-neutral-quaternary/40 border rounded-xl text-xs font-bold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:border-primary-base focus:bg-white transition-all ${
                      fieldErrors.height ? "border-red-400 bg-red-50/20" : "border-neutral-tertiary"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-grey-5">
                    cm
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="3"
                      max="8"
                      placeholder="Feet (e.g. 5)"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-neutral-quaternary/40 border rounded-xl text-xs font-bold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:border-primary-base focus:bg-white transition-all ${
                        fieldErrors.height
                          ? "border-red-400 bg-red-50/20"
                          : "border-neutral-tertiary"
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-grey-5">
                      ft
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="Inches (e.g. 9)"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-neutral-quaternary/40 border rounded-xl text-xs font-bold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:border-primary-base focus:bg-white transition-all ${
                        fieldErrors.height
                          ? "border-red-400 bg-red-50/20"
                          : "border-neutral-tertiary"
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-grey-5">
                      in
                    </span>
                  </div>
                </div>
              )}

              {heightUnit === "ft_in" && (heightFeet || heightInches) && (
                <p className="text-[11px] font-semibold text-grey-5">
                  Converts to:{" "}
                  <strong className="text-primary-base">
                    {feetInchesToCm(Number(heightFeet) || 0, Number(heightInches) || 0)} cm
                  </strong>{" "}
                  (sent in cm to AbleCare)
                </p>
              )}

              {fieldErrors.height && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.height}</span>
                </p>
              )}
            </div>

            {/* Dominant Hand */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-dark-1 flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-primary-base" />
                <span>Dominant Hand</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDominantHand("RIGHT")}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dominantHand === "RIGHT"
                      ? "bg-primary-base text-white border-primary-base shadow-xs"
                      : "bg-neutral-quaternary/40 text-dark-1 border-neutral-tertiary hover:bg-neutral-quaternary"
                  }`}
                >
                  {dominantHand === "RIGHT" && <CheckCircle2 className="w-4 h-4" />}
                  <span>Right (Default)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDominantHand("LEFT")}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dominantHand === "LEFT"
                      ? "bg-primary-base text-white border-primary-base shadow-xs"
                      : "bg-neutral-quaternary/40 text-dark-1 border-neutral-tertiary hover:bg-neutral-quaternary"
                  }`}
                >
                  {dominantHand === "LEFT" && <CheckCircle2 className="w-4 h-4" />}
                  <span>Left</span>
                </button>
              </div>

              {fieldErrors.dominant_hand && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.dominant_hand}</span>
                </p>
              )}
            </div>

            {/* Sex at Birth */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-dark-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary-base" />
                <span>Sex at Birth (Optional)</span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSexAtBirth("FEMALE")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sexAtBirth === "FEMALE"
                      ? "bg-primary-base text-white border-primary-base shadow-xs"
                      : "bg-neutral-quaternary/40 text-dark-1 border-neutral-tertiary hover:bg-neutral-quaternary"
                  }`}
                >
                  {sexAtBirth === "FEMALE" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Female</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSexAtBirth("MALE")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sexAtBirth === "MALE"
                      ? "bg-primary-base text-white border-primary-base shadow-xs"
                      : "bg-neutral-quaternary/40 text-dark-1 border-neutral-tertiary hover:bg-neutral-quaternary"
                  }`}
                >
                  {sexAtBirth === "MALE" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Male</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSexAtBirth("")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sexAtBirth === ""
                      ? "bg-neutral-tertiary text-dark-1 border-grey-2/30"
                      : "bg-neutral-quaternary/40 text-grey-5 border-neutral-tertiary hover:bg-neutral-quaternary"
                  }`}
                >
                  <span>Auto/Unset</span>
                </button>
              </div>

              {fieldErrors.sex_at_birth && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.sex_at_birth}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-dark-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-base" />
                <span>Date of Birth (Optional)</span>
              </label>

              <input
                type="date"
                max={todayStr}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={`w-full px-4 py-2.5 bg-neutral-quaternary/40 border rounded-xl text-xs font-bold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all ${
                  fieldErrors.date_of_birth
                    ? "border-red-400 bg-red-50/20"
                    : "border-neutral-tertiary"
                }`}
              />

              <p className="text-[11px] text-grey-5">
                Left empty, AbleCare auto-fills this from the ClubReady member list when available.
              </p>

              {fieldErrors.date_of_birth && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.date_of_birth}</span>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-7 border-t border-neutral-tertiary bg-neutral-quaternary/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 rounded-xl border border-neutral-tertiary font-black text-xs text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="ablecare-individual-form"
            disabled={saveMutation.isPending || isFetchingIndividual}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-base hover:bg-primary-base/90 text-white font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to AbleCare...</span>
              </>
            ) : (
              <span>{isEditMode ? "Save Changes" : "Confirm & Add to AbleCare"}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
