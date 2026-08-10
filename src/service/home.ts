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
