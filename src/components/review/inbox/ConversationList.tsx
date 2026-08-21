import React from "react";
import type { ConversationItem } from "../../../types/reviewInbox";
import { ConversationListItem } from "./ConversationListItem";
import { MessageSquare, Loader2, Info } from "lucide-react";
import { Input, FilterDropdown } from "../../shared";
import { Switch } from "../../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedClientNumber: string | null;
  onSelectClientNumber: (clientNumber: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (unread: boolean) => void;
  locationId: string;
  onLocationIdChange: (loc: string) => void;
  locationsList: Array<{ id: number | string; location_name: string }>;
  totalCount: number;
  isTruncated: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedClientNumber,
  onSelectClientNumber,
  isLoading,
  searchQuery,
  onSearchChange,
  unreadOnly,
  onUnreadOnlyChange,
  locationId,
  onLocationIdChange,
  locationsList,
  totalCount,
  isTruncated,
}) => {
  const filteredConversations = conversations.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.client_name?.toLowerCase().includes(q);
    const numberMatch = item.client_number?.toLowerCase().includes(q);
    const msgMatch = item.last_message?.toLowerCase().includes(q);
    return nameMatch || numberMatch || msgMatch;
  });

  const safeLocationsList = Array.isArray(locationsList) ? locationsList : [];

  const locationOptions = [
    { value: "all", label: "All Studio Locations" },
    ...safeLocationsList.map((loc) => ({
      value: String(loc.id),
      label: loc.location_name,
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-tertiary w-full overflow-hidden">
      {/* Header Panel matching Frontdesk theme */}
      <div className="p-4 border-b border-neutral-tertiary bg-neutral-quaternary/40 space-y-3 shrink-0">
        {/* Title & Unread Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-base text-white flex items-center justify-center font-black text-xs shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-dark-1 tracking-tight flex items-center gap-1.5">
                Messages
                {totalCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary-base/10 text-primary-base border border-primary-base/20">
                    {totalCount}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Unread Only Toggle */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-neutral-tertiary shadow-2xs">
            <span className="text-[11px] font-bold text-grey-5">
              Unread
            </span>
            <Switch
              checked={unreadOnly}
              onCheckedChange={onUnreadOnlyChange}
              className="scale-75 data-[state=checked]:bg-primary-base"
            />
          </div>
        </div>

        {/* Stacked Filter Controls */}
        <div className="flex flex-col gap-2.5 w-full">
          <Input
            type="text"
            icon="search"
            placeholder="Search name or number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs rounded-xl"
          />

          {safeLocationsList.length > 0 && (
            <FilterDropdown
              showLabel={false}
              placeholder="All Studio Locations"
              value={locationId}
              options={locationOptions}
              onChange={(val) => onLocationIdChange(val)}
              className="w-full text-xs"
            />
          )}
        </div>
      </div>

      {/* Truncated scan notification */}
      {isTruncated && (
        <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-[11px] text-amber-800 shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Showing recent 2,000 scanned messages</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-bold underline cursor-help hover:text-amber-900">Details</span>
            </TooltipTrigger>
            <TooltipContent className="bg-dark-1 text-white text-xs p-2.5 rounded-xl max-w-xs z-50 shadow-lg border border-neutral-tertiary">
              Older threads exist beyond the recent message scan budget. Select a location to filter scan results.
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* List items stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-tertiary/50 w-full custom-scrollbar">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 text-grey-2 gap-2.5">
            <Loader2 className="w-7 h-7 animate-spin text-primary-base" />
            <p className="text-xs font-semibold text-grey-5">Loading inbox...</p>
          </div>
        )}

        {!isLoading && filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-quaternary text-grey-2 flex items-center justify-center border border-neutral-tertiary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-dark-1">
              No conversations found
            </p>
            <p className="text-[11px] text-grey-5 max-w-[220px] leading-relaxed">
              {unreadOnly
                ? "No unread client messages at the moment."
                : "Client threads will appear automatically when review messages are sent."}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredConversations.map((item) => (
            <ConversationListItem
              key={item.client_number}
              item={item}
              isSelected={selectedClientNumber === item.client_number}
              onSelect={onSelectClientNumber}
            />
          ))}
      </div>
    </div>
  );
};
