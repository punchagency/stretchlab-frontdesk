import React from "react";
import type { ConversationItem } from "../../../types/reviewInbox";

interface ConversationListItemProps {
  item: ConversationItem;
  isSelected: boolean;
  onSelect: (clientNumber: string) => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const displayName = item.client_name || item.client_number;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div
      onClick={() => onSelect(item.client_number)}
      className={`group relative flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 w-full overflow-hidden border-b border-neutral-tertiary/60 ${
        isSelected
          ? "bg-primary-light border-l-4 border-l-primary-base font-bold"
          : "hover:bg-neutral-quaternary/60 border-l-4 border-l-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-xs transition-all duration-200 ${
            isSelected
              ? "bg-primary-base text-white shadow-md shadow-primary-base/20"
              : "bg-neutral-quaternary text-dark-1 border border-neutral-tertiary group-hover:bg-primary-base/10 group-hover:text-primary-base"
          }`}
        >
          {initial}
        </div>
        {item.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-accent-base text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
            {item.unread_count > 99 ? "99+" : item.unread_count}
          </span>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-xs sm:text-sm truncate ${
              item.unread_count > 0 ? "font-black text-dark-1" : "font-bold text-dark-1"
            }`}
          >
            {displayName}
          </h4>
          <span className="text-[10px] text-grey-5 shrink-0 font-medium">
            {formatRelativeTime(item.last_message_at)}
          </span>
        </div>

        {item.client_name && (
          <p className="text-[11px] text-grey-5 font-mono truncate mb-1">
            {item.client_number}
          </p>
        )}

        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          <p
            className={`text-xs truncate flex-1 ${
              item.unread_count > 0 ? "text-dark-1 font-bold" : "text-grey-5 font-medium"
            }`}
          >
            {item.last_message || <span className="italic text-grey-2">No messages yet</span>}
          </p>

          {item.location_name && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary-base/10 text-primary-base shrink-0 truncate max-w-[85px] border border-primary-base/20">
              {item.location_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
