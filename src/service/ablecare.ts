import { api } from "./api";

export interface AbleCareBadgeStatus {
  added: boolean;
  individual_id?: string;
  facility_id?: string;
  facility_name?: string;
  added_at?: string;
  added_by?: number;
  staff_id?: number | null;
  staff_name?: string | null;
}

export interface AbleCareIndividual {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  sex_at_birth?: "MALE" | "FEMALE" | string | null;
  dominant_hand?: "LEFT" | "RIGHT" | string | null;
  height?: number | null;
  external_ref?: string | null;
  facility?: string | null;
  organization?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AbleCareIndividualPayload {
  clubready_user_id: string | number;
  date_of_birth?: string | null;
  sex_at_birth?: "MALE" | "FEMALE" | string | null;
  dominant_hand?: "LEFT" | "RIGHT" | string | null;
  height?: number | null;
  staff_id?: number | null;
}

export interface AbleCareIndividualData {
  clubready_user_id: string;
  already_added: boolean;
  updated: boolean;
  facility_created: boolean;
  able_care: AbleCareBadgeStatus;
  individual?: AbleCareIndividual | null;
}

export interface AbleCareIndividualResponse {
  status: "success" | "error";
  data: AbleCareIndividualData;
}

export interface AbleCareGetIndividualResponse {
  status: "success" | "error";
  data: {
    clubready_user_id: string;
    able_care: AbleCareBadgeStatus;
    individual?: AbleCareIndividual | null;
  };
}

export interface AbleCareFacility {
  id: string;
  name: string;
  organization?: string;
}

export interface AbleCareFacilitiesResponse {
  status: "success" | "error";
  data: AbleCareFacility[];
}

/**
 * Add a new client to AbleCare, or update an existing individual's details.
 * Backend endpoint: POST /api/frontdesk/ablecare/individuals
 */
export const addOrUpdateAbleCareIndividual = async (
  payload: AbleCareIndividualPayload
): Promise<AbleCareIndividualResponse> => {
  // Sanitize payload: strip any forbidden fields and ensure height is integer number in cm
  const sanitized: Record<string, any> = {
    clubready_user_id: String(payload.clubready_user_id).trim(),
  };

  if (payload.date_of_birth) {
    sanitized.date_of_birth = payload.date_of_birth;
  }
  if (payload.sex_at_birth) {
    sanitized.sex_at_birth = payload.sex_at_birth.toUpperCase();
  }
  if (payload.dominant_hand) {
    sanitized.dominant_hand = payload.dominant_hand.toUpperCase();
  }
  if (payload.height != null && !Number.isNaN(Number(payload.height))) {
    sanitized.height = Math.round(Number(payload.height));
  }
  if (payload.staff_id != null) {
    sanitized.staff_id = payload.staff_id;
  }

  const response = await api.post<AbleCareIndividualResponse>(
    "/frontdesk/ablecare/individuals",
    sanitized
  );
  return response.data;
};

/**
 * Fetch a client's live AbleCare record and local badge.
 * Backend endpoint: GET /api/frontdesk/ablecare/individuals/<clubready_user_id>
 */
export const getAbleCareIndividual = async (
  clubreadyUserId: string | number
): Promise<AbleCareGetIndividualResponse> => {
  const response = await api.get<AbleCareGetIndividualResponse>(
    `/frontdesk/ablecare/individuals/${encodeURIComponent(String(clubreadyUserId).trim())}`
  );
  return response.data;
};

/**
 * Optional: Fetch AbleCare facilities list.
 * Backend endpoint: GET /api/frontdesk/ablecare/facilities
 */
export const getAbleCareFacilities = async (): Promise<AbleCareFacilitiesResponse> => {
  const response = await api.get<AbleCareFacilitiesResponse>(
    "/frontdesk/ablecare/facilities"
  );
  return response.data;
};

/**
 * Convert feet and inches to centimetres (rounded to nearest integer).
 */
export const feetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = (Number(feet) || 0) * 12 + (Number(inches) || 0);
  return Math.round(totalInches * 2.54);
};

/**
 * Convert centimetres to feet and inches.
 */
export const cmToFeetInches = (
  cm: number
): { feet: number; inches: number } => {
  if (!cm || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
};

export interface ParsedAbleCareError {
  message: string;
  fieldErrors?: Record<string, string>;
  isConflict?: boolean;
  isGatewayError?: boolean;
}

/**
 * Parse standard AbleCare error response payload.
 */
export const parseAbleCareError = (err: any): ParsedAbleCareError => {
  const status = err?.response?.status;
  const data = err?.response?.data;

  // 502 / Gateway / Network errors
  if (status === 502 || status === 504) {
    return {
      message:
        "AbleCare isn't responding right now. Please try again in a few minutes.",
      isGatewayError: true,
    };
  }

  // 409 Conflict (Add in progress or interrupted)
  if (status === 409) {
    return {
      message:
        data?.message ||
        "This client's AbleCare add is still in progress; try again in a couple of minutes.",
      isConflict: true,
    };
  }

  // 400 Bad Request with field-level errors
  const fieldErrors: Record<string, string> = {};
  if (data?.errors && typeof data.errors === "object") {
    Object.entries(data.errors).forEach(([field, msg]) => {
      fieldErrors[field] = Array.isArray(msg) ? msg.join(", ") : String(msg);
    });
  }

  // AbleCare-specific refusal message
  let message = data?.message || "An error occurred while communicating with AbleCare.";
  if (data?.ablecare?.detail) {
    message = String(data.ablecare.detail);
  } else if (data?.ablecare && typeof data.ablecare === "object") {
    // sometimes keyed by field
    Object.entries(data.ablecare).forEach(([k, v]) => {
      if (k !== "detail") {
        fieldErrors[k] = Array.isArray(v) ? v.join(", ") : String(v);
      }
    });
  }

  return {
    message,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    isConflict: false,
    isGatewayError: false,
  };
};

