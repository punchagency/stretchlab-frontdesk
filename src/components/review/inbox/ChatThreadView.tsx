import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../../../types/reviewInbox";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatComposer } from "./ChatComposer";
import {
  MessageSquare,
  Phone,
  MapPin,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface ChatThreadViewProps {
  clientNumber: string | null;
  clientName: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onSendMessage: (body: string) => Promise<void>;
  isSending: boolean;
  disabledComposer?: boolean;
  disabledReason?: string | null;
  onBackToList?: () => void;
}

export const ChatThreadView: React.FC<ChatThreadViewProps> = ({
  clientNumber,
  clientName,
  messages,
  isLoading,
  isFetching,
  onRefresh,
  onSendMessage,
  isSending,
  disabledComposer = false,
  disabledReason = null,
  onBackToList,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, clientNumber]);

  if (!clientNumber) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-quaternary/40 text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary-base/10 text-primary-base flex items-center justify-center mb-3 border border-primary-base/20 shadow-inner">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-dark-1 mb-1">
          Select a Conversation
        </h3>
        <p className="text-xs text-grey-5 max-w-sm leading-relaxed">
          Choose a client thread from the list on the left to view message history, track review requests, and send replies.
        </p>
      </div>
    );
  }

  // Check if latest message is an opt-out (STOP keyword)
  const isOptedOut = messages.some((m) => {
    if (m.direction === "inbound" && m.body) {
      const b = m.body.trim().toLowerCase();
      return ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"].includes(b);
    }
    return false;
  });

  const isComposerDisabled = disabledComposer || isOptedOut;
  const effectiveDisabledReason = isOptedOut
    ? "Client replied STOP and opted out of SMS messages. Replies are blocked by carrier policy."
    : disabledReason;

  const displayName = clientName || clientNumber;
  const locationTag = messages.find((m) => m.location_name)?.location_name;

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-neutral-quaternary/20 overflow-hidden">
      {/* Thread Header */}
      <div className="p-4 bg-white border-b border-neutral-tertiary flex items-center justify-between shadow-2xs gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="sm:hidden p-2 rounded-xl text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary transition-colors shrink-0"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-primary-base text-white flex items-center justify-center font-black text-sm uppercase shadow-sm shrink-0">
            {displayName.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-black text-dark-1 truncate">
              {displayName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-grey-5 font-medium truncate mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-grey-2 shrink-0" />
                <span className="truncate">{clientNumber}</span>
              </span>
              {locationTag && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-base/10 text-primary-base font-bold text-[10px] border border-primary-base/20 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{locationTag}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 font-bold text-xs flex items-center gap-1.5 transition-all border border-neutral-tertiary disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-base ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 text-grey-2 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-primary-base" />
            <p className="text-xs font-semibold text-grey-5">Loading thread history...</p>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center text-grey-2 gap-2">
            <MessageSquare className="w-8 h-8 text-grey-3" />
            <p className="text-xs font-semibold text-grey-5">No messages found in this thread.</p>
          </div>
        )}

        {!isLoading &&
          messages.map((message) => (
            <ChatMessageBubble key={message.id || message.created_at} message={message} />
          ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <ChatComposer
        onSendMessage={onSendMessage}
        isSending={isSending}
        disabled={isComposerDisabled}
        disabledReason={effectiveDisabledReason}
      />
    </div>
  );
};
