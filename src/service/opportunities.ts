import { api } from "./api";

export interface HealthcareOpportunityItem {
  id: number;
  first_name: string;
  last_name: string;
  gsl_category?: string;
  details?: string;
  due_date?: string;
  due_status?: string;
  cell_phone?: string;
  user_id?: string;
  email?: string;
  amount?: string;
  location?: string;
  agreement_date?: string;
  agreement_id?: string;
  processed_by?: string;
  sold_by?: string;
  invoice_id?: string;
  invoice_category?: string;
  invoice_class?: string;
  invoice_type?: string;
  user_pay_preference?: string;
  remark?: string;
  completed?: boolean | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface UnusedSessionOpportunityItem {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  user_id?: string;
  location?: string;
  package_name?: string;
  unused_credit?: string | number;
  cell_phone?: string;
  home_phone?: string;
  work_phone?: string;
  created_at?: string;
  completed?: boolean | null;
  completed_at?: string | null;
  updated_at?: string | null;
  contacted?: boolean;
  first_contacted_at?: string | null;
  latest_contacted_at?: string | null;
}

export interface OpportunitiesResponse<T> {
  message: string;
  data: T[];
  status: string;
}

export const getOpportunities = async <T = HealthcareOpportunityItem | UnusedSessionOpportunityItem>(
  type: "healthcare" | "increase"
): Promise<OpportunitiesResponse<T>> => {
  const response = await api.get<OpportunitiesResponse<T>>("/admin/report/get-report", {
    params: { type },
  });
  return response.data;
};

export interface ChangeOpportunityStatusParams {
  id: number;
  status: "completed" | "pending";
  type: "healthcare" | "increase";
}

export const changeOpportunityStatus = async (
  params: ChangeOpportunityStatusParams
) => {
  const response = await api.post("/admin/report/change-status", params);
  return response.data;
};

export interface ContactOpportunityParams {
  id: number;
  type: "increase";
}

export const contactOpportunity = async (params: ContactOpportunityParams) => {
  const response = await api.post("/admin/report/contacted", params);
  return response.data;
};
