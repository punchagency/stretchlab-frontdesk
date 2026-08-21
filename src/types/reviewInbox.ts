export interface ConversationItem {
  client_number: string;
  client_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  location_id: number | null;
  location_name: string | null;
}

export interface ConversationsResponse {
  status: string;
  conversations: ConversationItem[];
  total: number;
  truncated: boolean;
  limit: number;
}

export interface ChatMessage {
  id: string | number;
  client_number: string;
  client_name?: string | null;
  body: string;
  direction: "inbound" | "outbound";
  delivery_status: "queued" | "sending" | "sent" | "delivered" | "failed" | string;
  twilio_error_code?: string | number | null;
  twilio_error_message?: string | null;
  source: "automation" | "staff_reply" | "client" | string;
  sender_user_id?: number | null;
  created_at: string;
  location_id?: number | null;
  location_name?: string | null;
}

export interface ThreadResponse {
  status: string;
  client_number: string;
  client_name: string | null;
  messages: ChatMessage[];
  total: number;
}

export interface SendMessagePayload {
  client_number: string;
  body: string;
  location_id?: number;
}

export interface SendMessageResponse {
  status: string;
  message?: string;
  message_log?: ChatMessage;
}

export interface FetchConversationsParams {
  location_id?: number | string;
  unread_only?: boolean;
  limit?: number;
  scan?: number;
}

export interface FetchThreadParams {
  client_number: string;
  mark_read?: boolean;
  limit?: number;
}
