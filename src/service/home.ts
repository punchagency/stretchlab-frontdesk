import { api } from "./api";

export interface FrontdeskHomeParams {
  page?: number;
  page_size?: number;
  location_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface FirstTimerRecord {
  id: number;
  config_id?: number;
  client_name?: string;
  clubready_user_id?: string;
  customer_id?: string;
  location_name?: string;
  location?: string;
  location_id?: string;
  instructor?: string;
  flexologist_name?: string;
  booking_date?: string;
  booking_time?: string;
  booking_name?: string;
  appointment_date?: string;
  cellphone?: string;
  email?: string;
  status?: string;
  matched: boolean;
  matched_on?: string | null;
  days_before_visit?: number | null;
  days_before_appointment?: number | null;
  submission?: IntakeSubmission | null;
}

export interface IntakeSubmission {
  id: number;
  form_id: string | number;
  location_id: string;
  location_name?: string;
  client_name?: string;
  client_id?: string | number;
  submitter_id?: string | number;
  submitted_at: string;
  updated_at?: string;
  task_status?: string;
  matched?: boolean;
  matched_on?: string | null;
  days_before_visit?: number | null;
  days_before_appointment?: number | null;
  first_timer?: FirstTimerRecord | null;
}

export interface StudioLocation {
  location_id: string;
  location_name: string;
  normalized_location_name?: string;
}

export interface FrontdeskHomeResponse {
  status: string;
  data: {
    admin_id: number;
    config_ids: number[];
    locations: StudioLocation[];
    intake_form_ids: string[] | number[];
    first_timers: FirstTimerRecord[];
    submissions: IntakeSubmission[];
    pagination?: {
      page: number;
      page_size: number;
      total: number;
      total_pages: number;
    };
  };
}

export const getFrontdeskHome = async (params?: FrontdeskHomeParams) => {
  const response = await api.get<FrontdeskHomeResponse>("/frontdesk/home", {
    params,
  });
  return response;
};

export interface IntakeFormLocation {
  location_id: string;
  location_name: string;
  intake_form_submissions: number;
  first_visits: number;
  intake_form_submission_rate?: number;
  first_visits_with_intake_form?: number;
  first_visit_conversions_with_intake_form?: number;
  conversion_rate_with_intake_form?: number;
  first_visits_without_intake_form?: number;
  first_visit_conversions_without_intake_form?: number;
  conversion_rate_without_intake_form?: number;
  conversion_percentage: number;
  first_visits_from_intake_form: number;
  matched_conversion_percentage: number;
}

export interface IntakeFormConversionData {
  duration: string;
  start_date: string;
  end_date: string;
  intake_form_submissions: number;
  first_visits: number;
  intake_form_submission_rate?: number;
  first_visits_with_intake_form?: number;
  first_visit_conversions_with_intake_form?: number;
  conversion_rate_with_intake_form?: number;
  first_visits_without_intake_form?: number;
  first_visit_conversions_without_intake_form?: number;
  conversion_rate_without_intake_form?: number;
  first_visit_conversions?: number;
  conversion_rate?: number;
  conversion_percentage: number;
  first_visits_from_intake_form: number;
  matched_conversion_percentage: number;
  matched_by_client_id: number;
  matched_by_name: number;
  lookback_days: number;
  locations: IntakeFormLocation[];
}

export interface IntakeFormConversionResponse {
  status: string;
  data: IntakeFormConversionData;
}

export const getIntakeFormConversion = async (params: {
  duration?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.duration) {
    queryParams.append("duration", params.duration.toLowerCase());
  }
  if (params.location && params.location !== "All") {
    queryParams.append("location", params.location.toLowerCase());
  }
  if (params.duration === "custom" && params.startDate && params.endDate) {
    queryParams.append("start_date", params.startDate);
    queryParams.append("end_date", params.endDate);
  }
  const response = await api.get<IntakeFormConversionResponse>(
    `/admin/dashboard/intake_form_conversion?${queryParams.toString()}`
  );
  return response.data;
};

export interface IntakeEmailPayload {
  submission_id: number;
  recipient: string;
  location_id: string;
  location_name: string;
  client_name: string | null;
  subject: string;
  summary_included: boolean;
  message_id?: string;
}

export interface IntakeEmailSendResponse {
  status: string;
  message: string;
  data: IntakeEmailPayload;
}

export interface IntakeEmailPreviewData {
  submission_id: number;
  recipient: string | null;
  location_id: string;
  location_name: string;
  client_name: string | null;
  subject: string;
  summary_included: boolean;
  html: string;
  text: string;
}

export interface IntakeEmailPreviewResponse {
  status: string;
  message: string;
  data: IntakeEmailPreviewData;
}

export const sendIntakeEmail = async (submissionId: number | string) => {
  const response = await api.post<IntakeEmailSendResponse>(
    `/frontdesk/intake/${submissionId}/email`
  );
  return response.data;
};

export const previewIntakeEmail = async (submissionId: number | string) => {
  const response = await api.get<IntakeEmailPreviewResponse>(
    `/frontdesk/intake/${submissionId}/email-preview`
  );
  return response.data;
};

