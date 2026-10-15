import React from "react";
import {
  Shield,
  CreditCard,
  Clock,
  Calendar,
  Coins,
  UserCheck,
  MapPin,
} from "lucide-react";

interface HealthcareStats {
  total: number;
  locationsCount: number;
  withDueDate: number;
}

interface UnusedStats {
  totalClients: number;
  totalCredits: number;
  contacted: number;
  pendingContact: number;
}

interface OpportunitiesKpiCardsProps {
  activeTab: "healthcare" | "unused";
  healthcareStats: HealthcareStats;
  unusedStats: UnusedStats;
  unusedFilter?: "all" | "pending" | "contacted";
  onUnusedFilterChange?: (filter: "all" | "pending" | "contacted") => void;
}

export const OpportunitiesKpiCards: React.FC<OpportunitiesKpiCardsProps> = ({
  activeTab,
  healthcareStats,
  unusedStats,
  unusedFilter = "all",
  onUnusedFilterChange,
}) => {
  if (activeTab === "healthcare") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total Healthcare Clients */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-grey-2">
              Total Healthcare Clients
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-dark-1">
              {healthcareStats.total}
            </h3>
            <p className="text-[11px] text-grey-5 font-bold mt-0.5">
              Available sessions to book
            </p>
          </div>
        </div>

        {/* Card 2: Clients with Due Date */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-grey-2">
              Scheduled Due Dates
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-dark-1">
              {healthcareStats.withDueDate}
            </h3>
            <p className="text-[11px] text-grey-5 font-bold mt-0.5">
              Clients with target booking date
            </p>
          </div>
        </div>

        {/* Card 3: Active Studio Locations */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-grey-2">
              Studio Locations
            </span>
            <div className="w-10 h-10 rounded-xl bg-neutral-quaternary text-dark-1 border border-neutral-tertiary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-base" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-dark-1">
              {healthcareStats.locationsCount}
            </h3>
            <p className="text-[11px] text-grey-5 font-bold mt-0.5">
              Locations with healthcare records
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unused sessions KPI Cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Total Clients */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onUnusedFilterChange?.("all")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onUnusedFilterChange?.("all");
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer select-none text-left shadow-xs flex flex-col justify-between ${
          unusedFilter === "all"
            ? "bg-white border-primary-base ring-2 ring-primary-base/20 shadow-md"
            : "bg-white border-neutral-tertiary hover:border-primary-base/40 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-grey-2">
            Clients With Unused
          </span>
          <div className="w-10 h-10 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-dark-1">
            {unusedStats.totalClients}
          </h3>
          <p className="text-[11px] text-grey-5 font-bold mt-0.5">
            Paid & unbooked clients
          </p>
        </div>
      </div>

      {/* Card 2: Total Credits */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-grey-2">
            Total Unused Credits
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-700">
            {unusedStats.totalCredits}
          </h3>
          <p className="text-[11px] text-indigo-600 font-bold mt-0.5">
            Sessions ready to be scheduled
          </p>
        </div>
      </div>

      {/* Card 3: Needs Outreach */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onUnusedFilterChange?.("pending")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onUnusedFilterChange?.("pending");
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer select-none text-left shadow-xs flex flex-col justify-between ${
          unusedFilter === "pending"
            ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-md"
            : "bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Needs Outreach
            </span>
            {unusedStats.pendingContact > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-200 text-amber-900 animate-pulse">
                Action
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-900">
            {unusedStats.pendingContact}
          </h3>
          <p className="text-[11px] text-amber-700 font-bold mt-0.5">
            Ready for front desk contact
          </p>
        </div>
      </div>

      {/* Card 4: Already Contacted */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onUnusedFilterChange?.("contacted")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onUnusedFilterChange?.("contacted");
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer select-none text-left shadow-xs flex flex-col justify-between ${
          unusedFilter === "contacted"
            ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md"
            : "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Already Contacted
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-900">
            {unusedStats.contacted}
          </h3>
          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
            Contact logged & tracked
          </p>
        </div>
      </div>
    </div>
  );
};
