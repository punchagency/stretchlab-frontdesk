import React from "react";
import { getUserInfo, canAccessInbox } from "../utils/user";
import { ReviewInboxView } from "../components/review/inbox/ReviewInboxView";
import { MessageSquare, ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export const ReviewInbox: React.FC = () => {
  const userInfo = getUserInfo();
  const navigate = useNavigate();

  // Role Gate: OWNER (1), ADMIN (2), MANAGER (4), FRONT DESK (6). Flexologist (3) is denied.
  const isAuthorized = canAccessInbox(userInfo);

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-dark-1 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-grey-5 max-w-md mb-6 leading-relaxed">
          The SMS Review Inbox is available for Owners, Admins, Studio Managers, and Front Desk staff. Flexologist accounts do not have permission to view or send SMS replies.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-base text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-primary-base/90 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Banner matching Frontdesk style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20">
              Studio Communication
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-primary-base" />
            SMS Review Inbox
          </h1>
          <p className="text-grey-5 text-xs sm:text-sm mt-1">
            Monitor client feedback, review requests, and respond directly via SMS.
          </p>
        </div>
      </div>

      {/* Main Inbox View Container */}
      <ReviewInboxView />
    </div>
  );
};
