import { api } from "./api";
import { FollowUp, IntakeSubmission } from "./home";

export type Day = string; // "YYYY-MM-DD", studio-local
export type UtcStamp = string; // no zone, UTC: new Date(s + "Z")

export type ActionBadge =
  | "intake_form_missing"
  | "maps_due"
  | "future_bookings_below_target"
  | "goal_missing"
  | "goal_update_due"
  | "goal_template";

export interface Intake {
  form_received: boolean;
  submission: IntakeSubmission | null;
  days_before_visit: number | null;
  follow_up: FollowUp | null;
  location_id: string; // store id: send this to follow-ups/check
}

export interface Maps {
  due: boolean | null;
  last_reading: string | null;
  reading_date: Day | null;
  days_since_reading: number | null;
}

export interface FutureBookings {
  count: number | null;
  target: number | null;
  below_target: boolean | null;
}

export interface BookingGuidance {
  priority: "high" | "medium" | "low";
  booked_ahead: number;
  target: number;
  to_book: number;
  headline: string;
  suggestion: string;
  action: string;
  pattern: {
    visits: number;
    every_days: number | null;
    flexologist: string | null;
    weekday: string | null;
    time: string | null;
  };
  suggested_dates: Day[];
}

export type GoalSource = "note" | "intake" | "front_desk";

export interface Goal {
  on_file: boolean | null; // false = none yet ("Add goal"); null = unknown (no client id)
  goal: string | null;
  source: GoalSource | null;
  captured_at: UtcStamp | null;
  set_at?: UtcStamp | null; // when these words were set; the 90 days run from here
  days_since: number | null;
  update_due: boolean | null; // null when there's no goal
  template?: boolean | null; // same words for 3+ clients by one flexologist
  template_clients?: number | null;
}

export interface GoalEntry {
  id: number;
  goal: string;
  source: GoalSource;
  captured_at: UtcStamp;
  evidence: string | null;
  booking_id: string | null;
  form_submission_id: number | null;
  location_name: string | null;
  captured_by: number | null;
  captured_by_name: string | null;
}

export interface ClientGoalsData {
  clubready_user_id: string;
  today: Day;
  goal_update_after_days: number;
  goal: Goal;
  history: GoalEntry[];
}

export interface ClientActionRow {
  source: "bookings" | "first_visits";
  booking_id: string | null;
  clubready_user_id: string | null;
  client_name: string | null;
  first_name: string | null;
  last_name: string | null;
  location_name: string | null;
  scraped_location: string | null;
  booking_date: Day;
  booking_start: string | null;
  booking_end: string | null;
  session_mins: number | null;
  booking_detail: string | null;
  booking_with: string | null;
  booking_made_by: string | null;
  current_status: string | null;
  log_date: UtcStamp | null;
  last_seen_at: UtcStamp | null;
  stale: boolean;
  first_visit: boolean | null;
  intake: Intake | null;
  maps: Maps;
  future_bookings: FutureBookings;
  goal: Goal;
  booking_guidance?: BookingGuidance | null;
  badges: ActionBadge[];
}

export interface ClientActionsSummary {
  bookings: number;
  clients: number;
  first_visits: number;
  intake_form_missing: number;
  intake_followed_up: number;
  maps_due: number;
  future_bookings_below_target: number;
  goal_update_due: number;
  goal_missing: number;
  goal_template?: number;
  booking_guidance?: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ClientActionsWindow {
  date: Day;
  today: Day;
  bookings_as_of: UtcStamp | null;
  first_visits_known_until: Day;
  maps_due_after_days: number;
  future_bookings_target: number | null;
  goal_update_after_days: number;
}

export interface ClientActionsData {
  admin_id: number;
  window: ClientActionsWindow;
  bookings: ClientActionRow[];
  summary: ClientActionsSummary;
}

export interface ClientActionsResponse {
  status: string;
  data: ClientActionsData;
}

export interface ClientGoalsResponse {
  status: string;
  data: ClientGoalsData;
}

export interface AddGoalResponse {
  status: string;
  data: {
    clubready_user_id: string;
    goal: Goal;
    entry: GoalEntry;
  };
}

export const getClientActions = async (day: Day, locationId?: string) => {
  const response = await api.get<ClientActionsResponse>("/frontdesk/client-actions", {
    params: { date: day, ...(locationId ? { location_id: locationId } : {}) },
  });
  return response.data;
};

export const getClientGoals = async (clubreadyUserId: string) => {
  const response = await api.get<ClientGoalsResponse>("/frontdesk/client-goals", {
    params: { clubready_user_id: clubreadyUserId },
  });
  return response.data;
};

export const addClientGoal = async (clubreadyUserId: string, goal: string, locationId?: string) => {
  const response = await api.post<AddGoalResponse>("/frontdesk/client-goals", {
    clubready_user_id: clubreadyUserId,
    goal,
    ...(locationId ? { location_id: locationId } : {}),
  });
  return response.data;
};

export const localDay = (d = new Date()): Day =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// A row → the body follow-ups/check and /uncheck want (first visits only)
export const visitOfAction = (row: ClientActionRow) =>
  row.intake && row.clubready_user_id
    ? {
        location_id: row.intake.location_id,
        clubready_user_id: row.clubready_user_id,
        booking_date: row.booking_date,
      }
    : null;

export const actionRowKey = (row: ClientActionRow, index: number): string =>
  row.booking_id ?? `fv:${row.clubready_user_id ?? index}:${row.intake?.location_id ?? ""}`;

