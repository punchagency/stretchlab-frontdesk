import { api } from "./api";

export interface FrontdeskHomeParams {
  page?: number;
  page_size?: number;
  location_id?: string;
  start_date?: string;
  end_date?: string;
  lookback_days?: number;
}

export interface FollowUp {
  checked: boolean;
  checked_at: string;
  checked_by: number | null;
  checked_by_name: string | null;
  note: string | null;
}

export interface FirstTimerRecord {
  id: number;
  source?: "report" | "upcoming";
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
  last_seen_at?: string | null;
  stale?: boolean;
  follow_up?: FollowUp | null;
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

export interface FrontdeskHomeSummary {
  first_timers_matched?: number;
  first_timers_total?: number;
  first_timers_unmatched?: number;
  first_timers_followed_up?: number;
  submissions_matched?: number;
  submissions_total?: number;
  submissions_unmatched?: number;
}

export interface HomeWindow {
  start_date: string;
  end_date: string;
  lookback_days: number;
  upcoming_from: string;
  upcoming_as_of: string | null;
}

export interface FrontdeskHomeResponse {
  status: string;
  data: {
    admin_id: number;
    config_ids?: number[];
    locations: StudioLocation[];
    intake_form_ids: string[] | number[];
    window?: HomeWindow;
    first_timers: FirstTimerRecord[];
    submissions: IntakeSubmission[];
    summary?: FrontdeskHomeSummary;
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

// Follow-ups API
export interface VisitKey {
  location_id: string;
  clubready_user_id: string;
  booking_date: string;
}

export interface FollowUpResponse {
  status: string;
  data: {
    visit: {
      store_id: string;
      clubready_user_id: string;
      booking_date: string;
    };
    follow_up: FollowUp | null;
    removed?: boolean;
  };
}

export const checkFollowUp = async (visit: VisitKey, note?: string) => {
  const payload = note === undefined ? visit : { ...visit, note };
  const response = await api.post<FollowUpResponse>("/frontdesk/follow-ups/check", payload);
  return response.data;
};

export const uncheckFollowUp = async (visit: VisitKey) => {
  const response = await api.post<FollowUpResponse>("/frontdesk/follow-ups/uncheck", visit);
  return response.data;
};

export const visitOf = (row: FirstTimerRecord): VisitKey => ({
  location_id: row.location_id || "",
  clubready_user_id: row.clubready_user_id || "",
  booking_date: row.booking_date || "",
});

// ClubReady Live Refresh API
export interface RefreshOutcome {
  location_id: string | null;
  location_name: string;
  status: "refreshed" | "failed" | "skipped";
  first_visits: number | null;
  removed: number | null;
  error: string | null;
}

export interface RefreshResult {
  status: "success" | "partial" | "error";
  data: {
    date: string;
    refreshed_at: string;
    locations: RefreshOutcome[];
    summary: {
      locations: number;
      refreshed: number;
      failed: number;
      skipped: number;
      first_visits: number;
      removed: number;
    };
  };
  message?: string;
  error?: string;
}

export const refreshDay = async (day?: string, locationId?: string) => {
  const payload: { date?: string; location_id?: string } = {};
  if (day) payload.date = day;
  if (locationId) payload.location_id = locationId;

  const response = await api.post<RefreshResult>("/frontdesk/upcoming/refresh", payload, {
    timeout: 11 * 60 * 1000, // 11-minute timeout for scraping up to 10 locations
  });
  return response.data;
};

// Intake Insights API
export interface Baseline {
  first_visits: number;
  with_form: number;
  rate: number | null;
}

export interface InsightWeek {
  week_start: string;
  week_end: string;
  complete: boolean;
  days_reported: number;
  first_visits: number;
  with_form: number;
  rate: number | null;
  forms_submitted: number;
  baseline: Baseline | null;
  p_value: number | null;
  below_baseline: boolean;
  missing_days: string[];
  partial_days: string[];
  not_selected_days: string[];
}

export interface Streak {
  length: number;
  since: string | null;
  open_ended: boolean;
  baseline: Baseline | null;
  probability: number | null;
  unusual: boolean;
}

export type InsightAlert =
  | {
      kind: "below_baseline";
      scope: "totals" | "location";
      location_id: string | null;
      location_name: string | null;
      week_start: string;
      complete: boolean;
      first_visits: number;
      with_form: number;
      rate: number | null;
      baseline_rate: number | null;
      p_value: number | null;
    }
  | {
      kind: "no_form_streak";
      scope: "location";
      location_id: string;
      location_name: string | null;
      length: number;
      since: string;
      baseline_rate: number | null;
      probability: number | null;
    }
  | {
      kind: "missing_data";
      scope: "totals" | "location";
      location_id: string | null;
      location_name: string | null;
      days: string[];
    };

export interface InsightRules {
  baseline_weeks: number;
  below_baseline_p: number;
  streak_baseline_days: number;
  streak_horizon_days: number;
  streak_p: number;
  min_baseline_visits: number;
  recent_days: number;
}

export interface IntakeInsightsData {
  admin_id: number;
  as_of: string;
  upcoming_as_of: string | null;
  rules: InsightRules;
  alerts: InsightAlert[];
  totals: {
    weeks: InsightWeek[];
  };
  locations: {
    location_id: string;
    location_name: string;
    robot_selected: boolean | null;
    streak: Streak;
    weeks: InsightWeek[];
  }[];
}


export interface IntakeInsightsResponse {
  status: string;
  data: IntakeInsightsData;
}

export const getIntakeInsights = async (weeks = 8, locationId?: string) => {
  const params: { weeks: number; location_id?: string } = { weeks };
  if (locationId) params.location_id = locationId;

  const response = await api.get<IntakeInsightsResponse>("/frontdesk/insights", { params });
  return response.data;
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


