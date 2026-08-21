import React from "react";
import type { ChatMessage } from "../../../types/reviewInbox";
import { Check, CheckCheck, AlertTriangle, Bot, UserCheck, User } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isOutbound = message.direction === "outbound";

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getSourceBadge = () => {
    if (message.source === "automation") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-base/10 text-primary-base border border-primary-base/20">
          <Bot className="w-3 h-3" />
          Automation
        </span>
      );
    }
    if (message.source === "staff_reply") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <UserCheck className="w-3 h-3" />
          Staff Reply
        </span>
      );
    }
    if (!isOutbound) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-quaternary text-dark-1 border border-neutral-tertiary">
          <User className="w-3 h-3 text-grey-5" />
          Client
        </span>
      );
    }
    return null;
  };

  const getDeliveryStatusIcon = () => {
    if (!isOutbound) return null;
    const status = message.delivery_status?.toLowerCase();

    if (status === "delivered") {
      return <CheckCheck className="w-3.5 h-3.5 text-primary-secondary inline shrink-0" />;
    }
    if (status === "sent") {
      return <Check className="w-3.5 h-3.5 text-white/80 inline shrink-0" />;
    }
    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1 text-red-200" title={message.twilio_error_message || "Delivery failed"}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-200 shrink-0" />
        </span>
      );
    }
    return <span className="text-[10px] opacity-75 capitalize">{status || "sent"}</span>;
  };

  return (
    <div className={`flex flex-col my-1.5 ${isOutbound ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1 px-1">
        {getSourceBadge()}
        <span className="text-[10px] text-grey-5 font-medium">
          {formatTimestamp(message.created_at)}
        </span>
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
          isOutbound
            ? "bg-primary-base text-white rounded-br-none font-medium"
            : "bg-white text-dark-1 border border-neutral-tertiary rounded-bl-none shadow-2xs"
        }`}
      >
        <p>{message.body}</p>

        {isOutbound && (
          <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] opacity-90 font-mono">
            {getDeliveryStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
};
