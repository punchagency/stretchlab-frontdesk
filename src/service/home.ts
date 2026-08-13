import { api } from "./api";

export interface FrontdeskHomeParams {
  page?: number;
  page_size?: number;
  location_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface IntakeSubmission {
  id: number;
  form_id: number;
  location_id: string;
  location_name?: string;
  client_name?: string;
  submitter_id?: number;
  submitted_at: string;
  updated_at?: string;
  task_status?: string;
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
    locations: StudioLocation[];
    intake_form_ids: number[];
    submissions: IntakeSubmission[];
    pagination: {
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
