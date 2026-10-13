import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Mail,
  Send,
  X,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Building2,
} from "lucide-react";
import {
  previewIntakeEmail,
  sendIntakeEmail,
  sendIntakeEmailTo,
  IntakeEmailPreviewData,
} from "../../service/home";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";

interface SendIntakePeopleModalProps {
  submissionId: number | string | null;
  clientName?: string | null;
  locationName?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SendIntakePeopleModal: React.FC<SendIntakePeopleModalProps> = ({
  submissionId,
  clientName,
  locationName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"custom" | "studio">("custom");
  const [emails, setEmails] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [invalidList, setInvalidList] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<IntakeEmailPreviewData | null>(null);
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");
  const [isSending, setIsSending] = useState(false);
  const [isSendingStudio, setIsSendingStudio] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && submissionId) {
      setEmails([]);
      setInputVal("");
      setInvalidList([]);
      setActiveTab("custom");
      loadPreview(submissionId);
    } else {
      setPreviewData(null);
    }
  }, [isOpen, submissionId]);

  const loadPreview = async (id: number | string) => {
    try {
      setLoadingPreview(true);
      const res = await previewIntakeEmail(id);
      if (res?.data) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      // preview error handled gracefully
    } finally {
      setLoadingPreview(false);
    }
  };

  const addEmailsFromText = (text: string) => {
    const rawTokens = text
      .split(/[,;\s\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (rawTokens.length === 0) return;

    const newEmails = [...emails];
    const newInvalid: string[] = [];

    rawTokens.forEach((token) => {
      const lower = token.toLowerCase();
      if (!EMAIL_REGEX.test(token)) {
        newInvalid.push(token);
      } else if (!newEmails.some((e) => e.toLowerCase() === lower)) {
        if (newEmails.length < 20) {
          newEmails.push(token);
        }
      }
    });

    setEmails(newEmails);
    if (newInvalid.length > 0) {
      setInvalidList((prev) => Array.from(new Set([...prev, ...newInvalid])));
    }
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", " "].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) {
        addEmailsFromText(inputVal);
      }
    } else if (e.key === "Backspace" && !inputVal && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (pasted) {
      addEmailsFromText(pasted);
    }
  };

  const removeEmail = (index: number) => {
    const removed = emails[index];
    setEmails(emails.filter((_, i) => i !== index));
    if (removed) {
      setInvalidList((prev) => prev.filter((inv) => inv.toLowerCase() !== removed.toLowerCase()));
    }
  };

  const handleSendCustom = async () => {
    if (!submissionId) return;

    // Check if there is still text typed in the input
    let finalEmails = [...emails];
    if (inputVal.trim() && EMAIL_REGEX.test(inputVal.trim())) {
      const token = inputVal.trim();
      if (!finalEmails.some((e) => e.toLowerCase() === token.toLowerCase())) {
        finalEmails.push(token);
        setEmails(finalEmails);
      }
      setInputVal("");
    }

    if (finalEmails.length === 0) {
      renderErrorToast("Please enter at least one recipient email address.");
      return;
    }

    if (finalEmails.length > 20) {
      renderErrorToast("At most 20 email addresses can be sent at once.");
      return;
    }

    try {
      setIsSending(true);
      setInvalidList([]);
      const res = await sendIntakeEmailTo(submissionId, finalEmails);

      const count = res.data?.recipients?.length || finalEmails.length;
      renderSuccessToast(
        res.message || `Intake form successfully sent to ${count} recipient${count === 1 ? "" : "s"}.`
      );

      // Check if some addresses failed
      if (res.data?.failed && res.data.failed.length > 0) {
        const failedEmails = res.data.failed.map((f) => f.email).join(", ");
        renderErrorToast(`Could not deliver to: ${failedEmails}. Please verify those addresses.`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp?.invalid && Array.isArray(resp.invalid)) {
        setInvalidList(resp.invalid);
        renderErrorToast(resp.message || "Some of the email addresses are invalid. Please review highlighted tags.");
      } else {
        const msg = resp?.message || "Failed to send intake form to recipients.";
        renderErrorToast(msg);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendStudio = async () => {
    if (!submissionId) return;
    try {
      setIsSendingStudio(true);
      const res = await sendIntakeEmail(submissionId);
      const recipient = res?.data?.recipient || previewData?.recipient || "studio team mailbox";
      renderSuccessToast(res?.message || `Intake form successfully mailed to ${recipient}`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send intake form to studio inbox.";
      renderErrorToast(msg);
    } finally {
      setIsSendingStudio(false);
    }
  };

  if (!isOpen || !submissionId) return null;

  const displayClient = clientName || previewData?.client_name || "Client";
  const displayLocation = locationName || previewData?.location_name || "StretchLab Studio";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-neutral-tertiary flex flex-col max-h-[92vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-tertiary/60 flex items-center justify-between bg-neutral-quaternary/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary-base text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-dark-1 text-base sm:text-lg">
                  Send Intake Form & AI Summary
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-base/10 text-primary-base border border-primary-base/20">
                  #{submissionId}
                </span>
              </div>
              <p className="text-xs text-grey-5 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-dark-1">{displayClient}</span>
                <span>·</span>
                <span>{displayLocation}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending || isSendingStudio}
            className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 py-3 bg-neutral-quaternary/20 border-b border-neutral-tertiary/60">
          <div className="inline-flex items-center p-1 bg-neutral-quaternary rounded-xl border border-neutral-tertiary gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "custom"
                  ? "bg-white text-primary-base shadow-xs"
                  : "text-grey-5 hover:text-dark-1 hover:bg-white/50"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to People ({emails.length}/20)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "studio"
                  ? "bg-white text-primary-base shadow-xs"
                  : "text-grey-5 hover:text-dark-1 hover:bg-white/50"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Send to Studio Mailbox</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === "custom" ? (
            <>
              {/* Health Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-black">Medical & Health Privacy Notice</p>
                  <p className="text-amber-800 leading-relaxed font-medium">
                    This email includes the client's medical history, injuries, and surgeries alongside the AI analysis.
                    Recipients will each receive an independent copy, with your account as Reply-To.
                  </p>
                </div>
              </div>

              {/* Tag/Chip Input Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-dark-1 uppercase tracking-wider">
                    Recipient Email Addresses:
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      emails.length >= 20 ? "text-rose-600" : "text-grey-5"
                    }`}
                  >
                    {emails.length} / 20 max
                  </span>
                </div>

                <div
                  onClick={() => inputRef.current?.focus()}
                  className="min-h-[96px] p-2.5 bg-neutral-quaternary/30 border border-neutral-tertiary focus-within:border-primary-base focus-within:ring-2 focus-within:ring-primary-base/15 rounded-2xl transition-all cursor-text flex flex-wrap items-center gap-2 content-start"
                >
                  {emails.map((email, idx) => {
                    const isInvalid = invalidList.some(
                      (inv) => inv.toLowerCase() === email.toLowerCase()
                    );
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                          isInvalid
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-white text-dark-1 border border-neutral-tertiary/90 hover:border-primary-base/40"
                        }`}
                      >
                        <span className="font-mono text-[11px]">{email}</span>
                        {isInvalid && (
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEmail(idx);
                          }}
                          className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-grey-5 hover:text-dark-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  <input
                    ref={inputRef}
                    type="email"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={
                      emails.length === 0
                        ? "Type or paste email addresses (press Enter, Comma, or Space)..."
                        : emails.length < 20
                        ? "Add another email..."
                        : "Limit reached (20 recipients)"
                    }
                    disabled={emails.length >= 20 || isSending}
                    className="flex-1 min-w-[220px] bg-transparent border-none text-xs sm:text-sm text-dark-1 focus:outline-none placeholder:text-grey-2 font-medium py-1 px-1"
                  />
                </div>

                <p className="text-[11px] text-grey-5 flex items-center justify-between">
                  <span>Press <kbd className="px-1 py-0.5 bg-neutral-quaternary rounded border border-neutral-tertiary font-mono text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 bg-neutral-quaternary rounded border border-neutral-tertiary font-mono text-[10px]">Comma</kbd> to add. Paste comma or space-separated lists.</span>
                  {emails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEmails([])}
                      className="text-rose-600 hover:underline font-bold cursor-pointer text-[11px]"
                    >
                      Clear all
                    </button>
                  )}
                </p>
              </div>
            </>
          ) : (
            /* Studio Team Inbox Tab Info */
            <div className="p-5 rounded-2xl bg-neutral-quaternary/40 border border-neutral-tertiary/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-dark-1 text-sm">
                    Studio Shared Mailbox
                  </h4>
                  <p className="text-xs text-grey-5">
                    This will dispatch the intake form and AI summary to the shared location address:
                  </p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-tertiary flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-dark-1">
                  {previewData?.recipient || "studio@stretchlab.com"}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg">
                  Location Mailbox
                </span>
              </div>
            </div>
          )}

          {/* Email Preview Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-dark-1 uppercase tracking-wider">
                  Email Content Preview:
                </label>
                {previewData?.summary_included ? (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    AI Summary Included
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Answers Only
                  </span>
                )}
              </div>

              <div className="inline-flex items-center p-1 bg-neutral-quaternary rounded-xl border border-neutral-tertiary text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab("html")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewTab === "html"
                      ? "bg-white text-primary-base shadow-2xs font-extrabold"
                      : "text-grey-5 hover:text-dark-1"
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("text")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewTab === "text"
                      ? "bg-white text-primary-base shadow-2xs font-extrabold"
                      : "text-grey-5 hover:text-dark-1"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            <div className="border border-neutral-tertiary rounded-2xl overflow-hidden bg-white shadow-xs">
              {loadingPreview ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 text-primary-base animate-spin" />
                  <p className="text-xs text-grey-5 font-bold">Rendering intake preview...</p>
                </div>
              ) : previewData ? (
                previewTab === "html" ? (
                  <iframe
                    title="Intake Email Preview"
                    srcDoc={previewData.html}
                    className="w-full h-80 border-none bg-white"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <pre className="p-4 text-xs font-mono text-dark-1 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed bg-neutral-quaternary/20">
                    {previewData.text}
                  </pre>
                )
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-grey-5 italic">
                  Could not load preview.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-tertiary/60 flex items-center justify-between bg-neutral-quaternary/30 shrink-0">
          <p className="text-[11px] text-grey-5 font-medium hidden sm:inline">
            Replies will be routed to your account email address.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending || isSendingStudio}
              className="px-4 py-2.5 bg-white hover:bg-neutral-quaternary text-dark-1 font-bold text-xs rounded-xl border border-neutral-tertiary transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === "custom" ? (
              <button
                type="button"
                onClick={handleSendCustom}
                disabled={isSending || (emails.length === 0 && !inputVal.trim())}
                className="px-5 py-2.5 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-primary-base/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Emails...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Send to {emails.length || 1} {emails.length === 1 ? "Person" : "People"}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendStudio}
                disabled={isSendingStudio || loadingPreview}
                className="px-5 py-2.5 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-primary-base/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingStudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending to Studio...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Send to Studio Inbox</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
