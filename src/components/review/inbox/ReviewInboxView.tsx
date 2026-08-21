import React, { useState, useEffect } from "react";
import {
  useConversations,
  useConversationThread,
  useSendReviewMessage,
  useReviewLocations,
} from "../../../hooks/useReviewInbox";
import { ConversationList } from "./ConversationList";
import { ChatThreadView } from "./ChatThreadView";
import { toast } from "sonner";

export const ReviewInboxView: React.FC = () => {
  const [selectedClientNumber, setSelectedClientNumber] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [locationId, setLocationId] = useState("all");
  const [mobileActiveView, setMobileActiveView] = useState<"list" | "thread">("list");

  const { data: locationsData = [] } = useReviewLocations();

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversations({
    location_id: locationId === "all" ? undefined : locationId,
    unread_only: unreadOnly,
    limit: 50,
  });

  const {
    data: threadData,
    isLoading: isLoadingThread,
    isFetching: isFetchingThread,
    refetch: refetchThread,
  } = useConversationThread(selectedClientNumber, true);

  const sendMessageMutation = useSendReviewMessage();

  // Auto select first conversation on load
  useEffect(() => {
    if (
      !selectedClientNumber &&
      conversationsData?.conversations &&
      conversationsData.conversations.length > 0
    ) {
      setSelectedClientNumber(conversationsData.conversations[0].client_number);
    }
  }, [conversationsData, selectedClientNumber]);

  const handleSelectClient = (clientNum: string) => {
    setSelectedClientNumber(clientNum);
    setMobileActiveView("thread");
  };

  const handleSendMessage = async (body: string) => {
    if (!selectedClientNumber) return;

    try {
      const response = await sendMessageMutation.mutateAsync({
        client_number: selectedClientNumber,
        body,
        location_id: locationId !== "all" ? Number(locationId) : undefined,
      });

      if (response.status === "success" || response.message_log) {
        toast.success("Message sent successfully");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to send message";

      if (status === 403) {
        toast.error("Cannot text a client who has no existing thread or review queue entry.");
      } else if (status === 409) {
        toast.error(msg || "Client has opted out (STOP) or studio phone is unprovisioned.");
      } else if (status === 502) {
        toast.error("Twilio delivery error. Please try again.");
      } else {
        toast.error(msg);
      }
    }
  };

  const conversations = conversationsData?.conversations || [];
  const totalCount = conversationsData?.total || conversations.length;
  const isTruncated = Boolean(conversationsData?.truncated);
  const activeThreadMessages = threadData?.messages || [];
  const activeClientName =
    threadData?.client_name ||
    conversations.find((c) => c.client_number === selectedClientNumber)?.client_name ||
    null;

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[550px] max-h-[900px] w-full overflow-hidden rounded-3xl border border-neutral-tertiary bg-white shadow-xs">
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Panel: Conversation List */}
        <div
          className={`w-full sm:w-[320px] md:w-[350px] lg:w-[380px] shrink-0 h-full overflow-hidden ${
            mobileActiveView === "thread" ? "hidden sm:block" : "block"
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedClientNumber={selectedClientNumber}
            onSelectClientNumber={handleSelectClient}
            isLoading={isLoadingConversations}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            unreadOnly={unreadOnly}
            onUnreadOnlyChange={setUnreadOnly}
            locationId={locationId}
            onLocationIdChange={setLocationId}
            locationsList={locationsData}
            totalCount={totalCount}
            isTruncated={isTruncated}
          />
        </div>

        {/* Right Panel: Chat Thread View */}
        <div
          className={`flex-1 h-full overflow-hidden w-full ${
            mobileActiveView === "list" ? "hidden sm:flex" : "flex"
          }`}
        >
          <ChatThreadView
            clientNumber={selectedClientNumber}
            clientName={activeClientName}
            messages={activeThreadMessages}
            isLoading={isLoadingThread}
            isFetching={isFetchingThread}
            onRefresh={() => {
              refetchThread();
              refetchConversations();
            }}
            onSendMessage={handleSendMessage}
            isSending={sendMessageMutation.isPending}
            onBackToList={() => setMobileActiveView("list")}
          />
        </div>
      </div>
    </div>
  );
};
