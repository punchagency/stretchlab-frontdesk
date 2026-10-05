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
  count: number | null; // appointments (days) after the listed day
  bookings?: number | null; // every open booking; a day with two counts twice
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
  booking_habit: string | null; // sentence on how client usually books
  action: string;
  pattern: {
    visits: number; // appointments (days) in the 90 days before
    every_days: number | null;
    flexologist: string | null;
    weekday: string | null;
    time: string | null;
    sessions_per_visit?: number | null; // 2 = comes for two sessions
    booked_by?: "client" | "flexologist" | "staff" | null;
    books_at_a_time?: number | null;
    books_ahead_days?: number | null;
  };
  suggested_dates: Day[];
}

export type GoalSource = "note" | "intake" | "front_desk";

export interface Goal {
  on_file: boolean | null; // false = none yet ("Add goal"); null = unknown (no client id)
  goal: string | null;
  why: string | null; // newest why written, from any source, whatever goal it came with
  why_source?: GoalSource | null; // where that why came from: intake, note, or front_desk
  why_captured_at?: UtcStamp | null; // when it was written; can be older than captured_at
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
  why: string | null;
  source: GoalSource;
  captured_at: UtcStamp;
  evidence: string | null;
  booking_id: string | null;
  form_submission_id: number | null;
  location_name: string | null;
  captured_by: number | null;
  captured_by_name: string | null;
  staff_id?: number | null;
  staff_name?: string | null;
}

export interface ClientGoalsData {
  clubready_user_id: string;
  today: Day;
  goal_update_after_days: number;
  goal: Goal;
  history: GoalEntry[];
}

export type ActionKind = "intake_form" | "maps" | "book_next" | "goal";

export type CheckStatus = "confirmed" | "pending" | "not_confirmed" | "cant_check";

export interface MapsEvidence {
  reading: string | null;
  reading_date: Day | null;
  reading_location: string | null;
  flexologist_name: string | null;
  session_status: string | null;
}

export interface BookNextEvidence {
  claimed: number | null;
  found: number; // appointments (days)
  found_bookings?: number; // total bookings
  made_on: Day | null;
  bookings: {
    booking_id: string | null;
    booking_date: Day;
    booking_start: string | null;
    location_name: string | null;
    booking_made_by: string | null;
    made_at: string | null; // ClubReady's log time, studio-local
  }[];
  confirmed_at: UtcStamp | null;
}

export interface IntakeEvidence {
  form_received: boolean | null;
  submitted_at: string | null;
}

export interface GoalEvidence {
  client_goal_id: number | null;
}

export interface ActionCheck {
  status: CheckStatus;
  reason: string;
  evidence: MapsEvidence | BookNextEvidence | IntakeEvidence | GoalEvidence | any;
}

export interface ActionEntry {
  id: number;
  action: ActionKind;
  booking_date: Day;
  booking_id: string | null;
  location_name: string | null;
  store_id: string | null;
  booked_count: number | null; // book_next only
  client_goal_id: number | null; // goal only
  note: string | null;
  done_by: number;
  done_by_name: string | null; // the signed-in account
  staff_id: number | null;
  staff_name: string | null; // the desk team member; show this first
  done_at: UtcStamp;
  undone_at: UtcStamp | null;
  undone_by: number | null;
  undone_by_name: string | null;
  undone_staff_id: number | null;
  undone_staff_name: string | null;
  check?: ActionCheck | null;
}

export interface DeskStaffMember {
  id: number;
  name: string;
  accepted: boolean;
}

export interface DeskStaffData {
  staff: DeskStaffMember[];
  default_staff_id: number | null;
}

export interface DeskStaffResponse {
  status: string;
  data: DeskStaffData;
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
  actions_taken: ActionEntry[] | null;
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
  actions_taken?: Record<ActionKind, number> | null;
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

export const getDeskStaff = async () => {
  const response = await api.get<DeskStaffResponse>("/frontdesk/staff");
  return response.data;
};

export const getClientGoals = async (clubreadyUserId: string) => {
  const response = await api.get<ClientGoalsResponse>("/frontdesk/client-goals", {
    params: { clubready_user_id: clubreadyUserId },
  });
  return response.data;
};

export const addClientGoal = async (
  rowOrUserId: ClientActionRow | string,
  goal: string,
  options?: {
    why?: string;
    day?: Day;
    bookingId?: string | null;
    locationId?: string | null;
    staffId?: number | null;
  }
) => {
  let clubreadyUserId: string;
  let date: string | undefined = options?.day;
  let bookingId: string | undefined = options?.bookingId || undefined;
  let locationId: string | undefined = options?.locationId || undefined;

  if (typeof rowOrUserId === "object") {
    clubreadyUserId = rowOrUserId.clubready_user_id || "";
    date = options?.day || rowOrUserId.booking_date;
    if (rowOrUserId.booking_id) {
      bookingId = rowOrUserId.booking_id;
    } else if (rowOrUserId.intake?.location_id) {
      locationId = rowOrUserId.intake.location_id;
    }
  } else {
    clubreadyUserId = rowOrUserId;
  }

  const payload: any = {
    clubready_user_id: clubreadyUserId,
    goal: goal.trim(),
  };

  if (options?.why !== undefined) {
    payload.why = options.why;
  }
  if (date) {
    payload.date = date;
  }
  if (bookingId) {
    payload.booking_id = bookingId;
  } else if (locationId) {
    payload.location_id = locationId;
  }
  if (options?.staffId) {
    payload.staff_id = options.staffId;
  }

  const response = await api.post<AddGoalResponse>("/frontdesk/client-goals", payload);
  return response.data;
};

export const logClientAction = async (
  row: ClientActionRow,
  day: Day,
  action: "maps" | "book_next",
  extra: {
    note?: string;
    booked_count?: number;
    staff_id?: number;
  } = {}
) => {
  const payload: any = {
    action,
    clubready_user_id: row.clubready_user_id,
    date: day,
    ...(row.booking_id ? { booking_id: row.booking_id } : {}),
    ...extra,
  };
  const response = await api.post<{
    status: string;
    data: { entry: ActionEntry; created: boolean };
  }>("/frontdesk/client-actions/log", payload);
  return response.data;
};

export const undoClientAction = async (entryId: number, staffId?: number) => {
  const payload = staffId ? { staff_id: staffId } : {};
  const response = await api.post<{
    status: string;
    data: { entry: ActionEntry; undone: boolean };
  }>(`/frontdesk/client-actions/log/${entryId}/undo`, payload);
  return response.data;
};

export const toBook = (row: ClientActionRow) =>
  row.future_bookings.target != null && row.future_bookings.count != null
    ? Math.max(row.future_bookings.target - row.future_bookings.count, 0)
    : null;

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

// Action Log Look-Back Types & Service (Owner / Admin / Manager only)
export interface CheckCounts {
  entries: number;
  confirmed: number;
  pending: number;
  not_confirmed: number;
  cant_check: number;
  unchecked: number;
}

export interface ActionLogEntry extends ActionEntry {
  clubready_user_id: string;
  client_name: string | null;
  check: ActionCheck | null;
}

export interface ActionLogStaffRow extends CheckCounts {
  user_id: number;
  name: string | null;
  desk_staff: boolean;
  by_action: Partial<Record<ActionKind, CheckCounts>>;
}

export interface ActionLogData {
  admin_id: number;
  window: { from: Day; to: Day; today: Day };
  entries: ActionLogEntry[];
  by_staff: ActionLogStaffRow[];
  summary: CheckCounts & { by_action: Partial<Record<ActionKind, CheckCounts>> };
}

export interface ActionLogResponse {
  status: string;
  data: ActionLogData;
}

export const getActionLog = async (from?: Day, to?: Day) => {
  const response = await api.get<ActionLogResponse>("/frontdesk/client-actions/log", {
    params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
  });
  return response.data;
};
