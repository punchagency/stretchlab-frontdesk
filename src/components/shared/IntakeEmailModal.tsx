import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Mail,
  Send,
  X,
  Copy,
  Check,
  Sparkles,
  MapPin,
  User,
  AlertCircle,
  Loader2,
  FileCode,
  FileText,
} from "lucide-react";
import {
  previewIntakeEmail,
  sendIntakeEmail,
  IntakeEmailPreviewData,
} from "../../service/home";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";

interface IntakeEmailModalProps {
  submissionId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
  onSent?: (recipient: string) => void;
}

export const IntakeEmailModal = ({
  submissionId,
  isOpen,
  onClose,
  onSent,
}: IntakeEmailModalProps) => {
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<IntakeEmailPreviewData | null>(
    null
  );
  const [activeView, setActiveView] = useState<"html" | "text">("html");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchPreview(submissionId);
    } else {
      setPreviewData(null);
      setCopied(false);
    }
  }, [isOpen, submissionId]);

  const fetchPreview = async (id: number | string) => {
    try {
      setLoadingPreview(true);
      const res = await previewIntakeEmail(id);
      if (res && res.data) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to load email preview.";
      renderErrorToast(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!submissionId) return;
    try {
      setSending(true);
      const res = await sendIntakeEmail(submissionId);
      const recipient =
        res?.data?.recipient || previewData?.recipient || "studio team";
      renderSuccessToast(
        res?.message || `Intake form successfully sent to ${recipient}`
      );
      if (onSent) {
        onSent(recipient);
      }
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to send intake form email.";
      renderErrorToast(msg);
    } finally {
      setSending(false);
    }
  };

  const handleCopyRecipient = () => {
    if (!previewData?.recipient) return;
    navigator.clipboard.writeText(previewData.recipient);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !submissionId) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-neutral-quaternary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-dark-1 text-base sm:text-lg">
                Email Intake Form to Studio Team
              </h3>
              <p className="text-xs text-grey-5">
                Preview and mail the intake answers and AI summary to the
                studio's team mailbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-9 h-9 text-primary-base animate-spin" />
              <p className="text-xs font-bold text-grey-5 font-mono">
                Rendering intake email & AI summary preview...
              </p>
            </div>
          ) : !previewData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="text-sm font-bold text-dark-1">
                Unable to load preview
              </p>
              <button
                onClick={() => fetchPreview(submissionId)}
                className="px-4 py-2 bg-primary-base/10 text-primary-base font-bold text-xs rounded-xl hover:bg-primary-base/20 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Meta & Destination Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Recipient */}
                <div className="p-3.5 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-1">
                  <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                    Team Recipient Inbox
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-black text-dark-1 text-xs truncate">
                      {previewData.recipient || "No recipient found"}
                    </span>
                    {previewData.recipient && (
                      <button
                        onClick={handleCopyRecipient}
                        title="Copy email address"
                        className="p-1 hover:bg-white rounded-md text-grey-5 hover:text-primary-base transition-all shrink-0 cursor-pointer"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Studio Location */}
                <div className="p-3.5 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-1">
                  <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                    Studio Location
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-dark-1 text-xs truncate">
                    <MapPin className="w-3.5 h-3.5 text-grey-2 shrink-0" />
                    <span className="truncate">
                      {previewData.location_name || `Location #${previewData.location_id}`}
                    </span>
                  </div>
                </div>

                {/* Client / Summary Status */}
                <div className="p-3.5 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl space-y-1">
                  <span className="text-[10px] text-grey-2 font-bold uppercase tracking-wider block">
                    Client & Status
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 font-extrabold text-dark-1 text-xs truncate">
                      <User className="w-3.5 h-3.5 text-grey-2 shrink-0" />
                      <span className="truncate">{previewData.client_name || "Unknown"}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        previewData.summary_included
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {previewData.summary_included ? "AI Included" : "Pending AI"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject line banner */}
              <div className="px-4 py-2.5 bg-neutral-quaternary/30 border border-neutral-tertiary/60 rounded-xl flex items-center gap-2 text-xs">
                <span className="font-bold text-grey-5 uppercase text-[10px] tracking-wider shrink-0">
                  Subject:
                </span>
                <span className="font-semibold text-dark-1 truncate font-mono text-[11px]">
                  {previewData.subject}
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 bg-neutral-quaternary p-1 rounded-xl">
                  <button
                    onClick={() => setActiveView("html")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeView === "html"
                        ? "bg-white text-dark-1 shadow-xs"
                        : "text-grey-5 hover:text-dark-1"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Formatted HTML Email</span>
                  </button>
                  <button
                    onClick={() => setActiveView("text")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeView === "text"
                        ? "bg-white text-dark-1 shadow-xs"
                        : "text-grey-5 hover:text-dark-1"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Plain Text</span>
                  </button>
                </div>
                <span className="text-[11px] text-grey-2 hidden sm:inline">
                  Exact preview of what will be received in the inbox
                </span>
              </div>

              {/* Preview Content Area */}
              <div className="border border-neutral-tertiary rounded-2xl overflow-hidden bg-white shadow-xs">
                {activeView === "html" ? (
                  <iframe
                    title="Email Preview"
                    srcDoc={previewData.html}
                    className="w-full h-[400px] border-none bg-white"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <pre className="p-4 sm:p-6 text-xs text-dark-1 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto bg-gray-50/50">
                    {previewData.text}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-quaternary/30 shrink-0">
          <p className="text-[11px] text-grey-5 text-center sm:text-left">
            Replies will be routed directly to your staff account email.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-grey-5 hover:bg-neutral-quaternary transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSend}
              disabled={sending || loadingPreview || !previewData?.recipient}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-primary-base hover:bg-opacity-95 text-white flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Mail...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Studio ({previewData?.recipient || "Team"})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
