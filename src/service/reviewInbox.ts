import { api } from "./api";
import type {
  ConversationsResponse,
  ThreadResponse,
  SendMessagePayload,
  SendMessageResponse,
  FetchConversationsParams,
  FetchThreadParams,
} from "../types/reviewInbox";

export const getConversations = async (
  params?: FetchConversationsParams
): Promise<ConversationsResponse> => {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.location_id && params.location_id !== "all") {
    queryParams.location_id = params.location_id;
  }
  if (params?.unread_only) {
    queryParams.unread_only = true;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }
  if (params?.scan) {
    queryParams.scan = params.scan;
  }

  const { data } = await api.get<ConversationsResponse>("/admin/review/conversations", {
    params: queryParams,
  });
  return data;
};

export const getConversationThread = async (
  params: FetchThreadParams
): Promise<ThreadResponse> => {
  const queryParams: Record<string, string | number | boolean> = {
    client_number: params.client_number,
    mark_read: params.mark_read ?? true,
  };
  if (params.limit) {
    queryParams.limit = params.limit;
  }

  const { data } = await api.get<ThreadResponse>("/admin/review/conversation", {
    params: queryParams,
  });
  return data;
};

export const sendReviewMessage = async (
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {
  const { data } = await api.post<SendMessageResponse>(
    "/admin/review/send-message",
    payload
  );
  return data;
};

export const getReviewLocations = async () => {
  try {
    const { data } = await api.get("/admin/review/get-location");
    if (Array.isArray(data?.locations)) return data.locations;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
};
