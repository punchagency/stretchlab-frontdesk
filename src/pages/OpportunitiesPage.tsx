import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  CreditCard,
  MapPin,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  getOpportunities,
  HealthcareOpportunityItem,
  UnusedSessionOpportunityItem,
} from "../service/opportunities";
import { getFrontdeskHome, StudioLocation } from "../service/home";
import {
  OpportunitiesKpiCards,
  HealthcareOpportunitiesTab,
  UnusedSessionsOpportunitiesTab,
} from "../components/opportunities";
import { exportToCsv } from "../utils/exportCsv";
import { renderSuccessToast } from "../utils/toast";

export const OpportunitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"healthcare" | "unused">("healthcare");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Status filter for unused sessions
  const [unusedFilter, setUnusedFilter] = useState<
    "all" | "pending" | "contacted"
  >("all");

  // Fetch Studio Locations from home response
  const { data: homeData } = useQuery({
    queryKey: ["frontdesk-home-locations"],
    queryFn: async () => {
      const res = await getFrontdeskHome({ page: 1, page_size: 1 });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const locations: StudioLocation[] = useMemo(
    () => homeData?.locations || [],
    [homeData]
  );

  // Queries for the two opportunities report types
  const {
    data: healthcareResponse,
    isLoading: isHealthcareLoading,
    isRefetching: isHealthcareRefetching,
    refetch: refetchHealthcare,
  } = useQuery({
    queryKey: ["opportunities", "healthcare"],
    queryFn: () => getOpportunities<HealthcareOpportunityItem>("healthcare"),
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: unusedResponse,
    isLoading: isUnusedLoading,
    isRefetching: isUnusedRefetching,
    refetch: refetchUnused,
  } = useQuery({
    queryKey: ["opportunities", "increase"],
    queryFn: () => getOpportunities<UnusedSessionOpportunityItem>("increase"),
    staleTime: 2 * 60 * 1000,
  });

  const healthcareData = useMemo(
    () => healthcareResponse?.data || [],
    [healthcareResponse]
  );

  const unusedData = useMemo(
    () => unusedResponse?.data || [],
    [unusedResponse]
  );

  // KPI Calculations
  const healthcareStats = useMemo(() => {
    const total = healthcareData.length;
    const locationsSet = new Set(
      healthcareData.map((d) => d.location).filter(Boolean)
    );
    const withDueDate = healthcareData.filter((d) => Boolean(d.due_date)).length;

    return { total, locationsCount: locationsSet.size, withDueDate };
  }, [healthcareData]);

  const unusedStats = useMemo(() => {
    const totalClients = unusedData.length;
    const totalCredits = unusedData.reduce(
      (sum, item) => sum + (Number(item.unused_credit) || 0),
      0
    );
    const contacted = unusedData.filter((d) => d.contacted === true).length;
    const pendingContact = totalClients - contacted;

    return { totalClients, totalCredits, contacted, pendingContact };
  }, [unusedData]);

  const isCurrentRefetching =
    activeTab === "healthcare" ? isHealthcareRefetching : isUnusedRefetching;

  // Refresh handler
  const handleRefresh = async () => {
    if (activeTab === "healthcare") {
      await refetchHealthcare();
    } else {
      await refetchUnused();
    }
    renderSuccessToast("Opportunities refreshed successfully");
  };

  // CSV Export handler
  const handleExportCsv = () => {
    if (activeTab === "healthcare") {
      const rows = healthcareData.map((h) => ({
        client_name: `${h.first_name || ""} ${h.last_name || ""}`.trim(),
        user_id: h.user_id || "",
        email: h.email || "",
        phone: h.cell_phone || "",
        location: h.location || "",
        due_date: h.due_date || "",
        sold_by: h.sold_by || "",
        remark: h.remark || "",
      }));
      exportToCsv("healthcare_opportunities", rows, [
        { key: "client_name", label: "Client Name" },
        { key: "user_id", label: "User ID" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "location", label: "Location" },
        { key: "due_date", label: "Due Date" },
        { key: "sold_by", label: "Sold By" },
        { key: "remark", label: "Remark" },
      ]);
    } else {
      const rows = unusedData.map((u) => ({
        client_name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
        user_id: u.user_id || "",
        email: u.email || "",
        phone: u.cell_phone || u.home_phone || u.work_phone || "",
        location: u.location || "",
        package_name: u.package_name || "",
        unused_credits: u.unused_credit || "0",
        contacted: u.contacted ? "Yes" : "No",
        first_contacted_at: u.first_contacted_at || "",
        latest_contacted_at: u.latest_contacted_at || "",
      }));
      exportToCsv("unused_sessions_opportunities", rows, [
        { key: "client_name", label: "Client Name" },
        { key: "user_id", label: "User ID" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "location", label: "Location" },
        { key: "package_name", label: "Package / Membership" },
        { key: "unused_credits", label: "Unused Credits" },
        { key: "contacted", label: "Contacted" },
        { key: "first_contacted_at", label: "First Contacted" },
        { key: "latest_contacted_at", label: "Latest Contacted" },
      ]);
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card matching Home.tsx & ClientIntakesPage */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20">
                FrontDesk Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
              Opportunities
            </h1>
            <p className="text-grey-5 text-xs sm:text-sm mt-1 font-medium">
              Healthcare clients with available sessions & paid unused sessions ready for booking
            </p>
          </div>

          {/* Header Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {/* Location Selector */}
            <div className="flex items-center gap-2 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-grey-2 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs font-semibold text-dark-1 focus:outline-none cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => {
                  const locId = typeof loc === "object" ? loc?.location_id : loc;
                  const locName = typeof loc === "object" ? loc?.location_name : loc;
                  return (
                    <option key={locId} value={locName}>
                      {locName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-extrabold rounded-xl text-xs border border-neutral-tertiary transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Export active table to CSV"
            >
              <Download className="w-4 h-4 text-grey-5" />
              <span>Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isCurrentRefetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-extrabold rounded-xl text-xs border border-neutral-tertiary transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isCurrentRefetching ? "animate-spin text-primary-base" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <OpportunitiesKpiCards
        activeTab={activeTab}
        healthcareStats={healthcareStats}
        unusedStats={unusedStats}
        unusedFilter={unusedFilter}
        onUnusedFilterChange={setUnusedFilter}
      />

      {/* Main Filter & Table Card Container matching Home.tsx & ClientIntakesPage */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-6">
        {/* Tab Switcher Row matching Home.tsx subView tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-tertiary pb-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("healthcare");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "healthcare"
                  ? "bg-primary-base text-white shadow-xs"
                  : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Healthcare Clients ({healthcareStats.total})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("unused");
                setUnusedFilter("all");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "unused"
                  ? "bg-primary-base text-white shadow-xs"
                  : "bg-neutral-quaternary text-grey-5 hover:text-dark-1"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Unused Sessions ({unusedStats.totalClients})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Tables */}
        {activeTab === "healthcare" ? (
          <HealthcareOpportunitiesTab
            data={healthcareData}
            isLoading={isHealthcareLoading}
            selectedLocation={selectedLocation}
          />
        ) : (
          <UnusedSessionsOpportunitiesTab
            data={unusedData}
            isLoading={isUnusedLoading}
            selectedLocation={selectedLocation}
            statusFilter={unusedFilter}
            onStatusFilterChange={setUnusedFilter}
          />
        )}
      </div>
    </div>
  );
};
export default OpportunitiesPage;
