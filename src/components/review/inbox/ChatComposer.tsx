import React, { useState } from "react";
import { Send, Loader2, ShieldAlert } from "lucide-react";

interface ChatComposerProps {
  onSendMessage: (body: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isSending,
  disabled = false,
  disabledReason = null,
}) => {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;
    try {
      await onSendMessage(trimmed);
      setText("");
    } catch {
      // Handled in parent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div className="p-4 bg-red-50 border-t border-red-100 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
        <p className="text-xs sm:text-sm font-medium text-red-800">
          {disabledReason || "Replies are disabled for this thread."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-neutral-tertiary">
      <div className="relative flex items-end gap-2 bg-neutral-quaternary/60 rounded-2xl p-2.5 border border-neutral-tertiary focus-within:border-primary-base focus-within:ring-1 focus-within:ring-primary-base transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply... (Press Enter to send, Shift+Enter for new line)"
          rows={2}
          disabled={isSending}
          className="flex-1 bg-transparent border-0 resize-none outline-none focus:ring-0 text-xs sm:text-sm text-dark-1 placeholder:text-grey-2 p-1 min-h-[44px] max-h-32"
        />

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-mono px-1.5 ${
              text.length > 160 ? "text-amber-600 font-bold" : "text-grey-2"
            }`}
          >
            {text.length} chars
          </span>

          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="bg-primary-base hover:bg-primary-base/90 text-white rounded-xl h-9 px-4 flex items-center gap-1.5 font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <Send className="w-3.5 h-3.5 shrink-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
