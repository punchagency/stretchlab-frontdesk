import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getConversationThread,
  sendReviewMessage,
  getReviewLocations,
} from "../service/reviewInbox";
import type {
  FetchConversationsParams,
  SendMessagePayload,
  ConversationsResponse,
  ThreadResponse,
} from "../types/reviewInbox";

export const REVIEW_INBOX_KEYS = {
  conversations: (params?: FetchConversationsParams) =>
    ["review-inbox", "conversations", params] as const,
  thread: (clientNumber: string | null) =>
    ["review-inbox", "thread", clientNumber] as const,
  locations: () => ["review-inbox", "locations"] as const,
};

export const useReviewLocations = () => {
  return useQuery({
    queryKey: REVIEW_INBOX_KEYS.locations(),
    queryFn: getReviewLocations,
    staleTime: 10 * 60 * 1000,
  });
};

export const useConversations = (
  params?: FetchConversationsParams,
  refetchIntervalMs: number = 15000
) => {
  return useQuery<ConversationsResponse>({
    queryKey: REVIEW_INBOX_KEYS.conversations(params),
    queryFn: () => getConversations(params),
    refetchInterval: refetchIntervalMs,
    staleTime: 5000,
  });
};

export const useConversationThread = (
  clientNumber: string | null,
  markRead: boolean = true,
  refetchIntervalMs: number = 5000
) => {
  return useQuery<ThreadResponse>({
    queryKey: REVIEW_INBOX_KEYS.thread(clientNumber),
    queryFn: () => {
      if (!clientNumber) {
        throw new Error("Client number is required");
      }
      return getConversationThread({ client_number: clientNumber, mark_read: markRead });
    },
    enabled: Boolean(clientNumber),
    refetchInterval: clientNumber ? refetchIntervalMs : false,
    staleTime: 2000,
  });
};

export const useSendReviewMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendReviewMessage(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: REVIEW_INBOX_KEYS.thread(variables.client_number),
      });

      queryClient.invalidateQueries({
        queryKey: ["review-inbox", "conversations"],
      });

      if (data.message_log) {
        queryClient.setQueryData<ThreadResponse>(
          REVIEW_INBOX_KEYS.thread(variables.client_number),
          (old) => {
            if (!old) return old;
            const exists = old.messages.some((m) => m.id === data.message_log?.id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, data.message_log!],
            };
          }
        );
      }
    },
  });
};
