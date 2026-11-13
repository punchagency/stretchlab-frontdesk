import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  Search,
  MapPin,
  RefreshCw,
  X,
  Users,
  ShieldCheck,
  Building2,
} from "lucide-react";
import {
  getClientActions,
  localDay,
  ClientActionRow,
} from "../service/clientActions";
import { getFrontdeskHome, StudioLocation } from "../service/home";
import { DataTable } from "../components/shared";
import { AbleCareBadge } from "../components/ablecare/AbleCareBadge";
import { AbleCareIndividualModal } from "../components/ablecare/AbleCareIndividualModal";
import { AbleCareQuickLookupModal } from "../components/ablecare/AbleCareQuickLookupModal";

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const AbleCarePage: React.FC = () => {
  const todayStr = useMemo(() => localDay(), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return localDay(d);
  }, []);

  // Filter States
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "needs_add" | "added">("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Modal States
  const [activeModalClient, setActiveModalClient] = useState<{
    clubreadyUserId: string;
    clientName?: string;
    locationName?: string;
    isEdit: boolean;
  } | null>(null);

  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState(false);

  // Fetch locations
  const { data: homeData } = useQuery({
    queryKey: ["frontdesk-home-locations"],
    queryFn: async () => {
      const res = await getFrontdeskHome({ page_size: 1 });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const locations: StudioLocation[] = homeData?.locations || [];

  // Fetch Client Actions roster with able_care badges
  const {
    data: clientActionsResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["client-actions", selectedDate, selectedLocation],
    queryFn: () =>
      getClientActions(
        selectedDate,
        selectedLocation || undefined
      ),
    staleTime: 60 * 1000,
  });

  const bookings: ClientActionRow[] = useMemo(() => {
    return clientActionsResponse?.data?.bookings || [];
  }, [clientActionsResponse]);

  // Unique clients deduplication (one entry per client on the day)
  const uniqueClients = useMemo(() => {
    const map = new Map<string, ClientActionRow>();
    bookings.forEach((row) => {
      const key = row.clubready_user_id || `booking_${row.booking_id}`;
      if (!map.has(key)) {
        map.set(key, { ...row });
      } else {
        const existing = map.get(key)!;
        // If a duplicate booking has confirmed AbleCare status, prioritize it
        if (!existing.able_care?.added && row.able_care?.added) {
          existing.able_care = row.able_care;
        }
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  // KPI Calculations
  const stats = useMemo(() => {
    let addedCount = 0;
    let needsAddCount = 0;
    const facilitiesSet = new Set<string>();

    uniqueClients.forEach((row) => {
      if (row.able_care?.added) {
        addedCount++;
        if (row.able_care.facility_name) {
          facilitiesSet.add(row.able_care.facility_name);
        }
      } else if (row.clubready_user_id) {
        needsAddCount++;
      }
    });

    return {
      total: uniqueClients.length,
      added: addedCount,
      needsAdd: needsAddCount,
      facilitiesCount: facilitiesSet.size,
    };
  }, [uniqueClients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return uniqueClients.filter((row) => {
      // Status filter
      if (statusFilter === "needs_add") {
        if (row.able_care?.added || !row.clubready_user_id) return false;
      } else if (statusFilter === "added") {
        if (!row.able_care?.added) return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const clientName = (row.client_name || "").toLowerCase();
        const userId = (row.clubready_user_id || "").toLowerCase();
        const location = (row.location_name || "").toLowerCase();
        const bookingWith = (row.booking_with || "").toLowerCase();
        const facility = (row.able_care?.facility_name || "").toLowerCase();

        return (
          clientName.includes(query) ||
          userId.includes(query) ||
          location.includes(query) ||
          bookingWith.includes(query) ||
          facility.includes(query)
        );
      }

      return true;
    });
  }, [uniqueClients, statusFilter, search]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const paginatedClients = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, validPage, pageSize]);

  // Table Columns
  const columns = [
    {
      header: "Client",
      cell: ({ row }: any) => {
        const client: ClientActionRow = row.original;
        const isAdded = Boolean(client.able_care?.added);
        return (
          <div className="flex items-center gap-3 py-1">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border ${
                isAdded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-primary-base/10 text-primary-base border-primary-base/20"
              }`}
            >
              {getInitials(client.client_name)}
            </div>
            <div>
              <p className="font-extrabold text-dark-1 text-xs">
                {client.client_name || "Unknown Client"}
              </p>
              <p className="text-[10px] text-grey-2 font-mono">
                {client.clubready_user_id
                  ? `ID #${client.clubready_user_id}`
                  : "No ClubReady ID"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Booking / Arrival",
      cell: ({ row }: any) => {
        const client: ClientActionRow = row.original;
        return (
          <div className="space-y-0.5">
            <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-neutral-quaternary border border-neutral-tertiary text-[11px] font-black text-dark-1">
              <span>{client.booking_start || "Open Visit"}</span>
              {client.booking_end && (
                <span className="text-grey-5 font-medium ml-1">- {client.booking_end}</span>
              )}
            </div>
            {client.booking_with && (
              <p className="text-[10px] text-grey-5 font-semibold">
                with {client.booking_with}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: "Studio Location",
      cell: ({ row }: any) => {
        const client: ClientActionRow = row.original;
        return (
          <span className="inline-flex items-center text-[11px] font-bold text-dark-1 bg-neutral-quaternary px-2.5 py-1 rounded-lg border border-neutral-tertiary">
            <span>{client.location_name || "Location"}</span>
          </span>
        );
      },
    },
    {
      header: "AbleCare Status",
      cell: ({ row }: any) => {
        const client: ClientActionRow = row.original;
        return (
          <AbleCareBadge
            ableCare={client.able_care}
            clubreadyUserId={client.clubready_user_id}
            size="sm"
            showActionButtons={false}
            showIcon={false}
          />
        );
      },
    },
    {
      header: "Action",
      size: 150,
      cell: ({ row }: any) => {
        const client: ClientActionRow = row.original;
        if (!client.clubready_user_id) {
          return (
            <span className="text-[11px] text-grey-2 italic">Cannot Add</span>
          );
        }

        const isAdded = Boolean(client.able_care?.added);

        if (isAdded) {
          return (
            <button
              type="button"
              onClick={() =>
                setActiveModalClient({
                  clubreadyUserId: client.clubready_user_id!,
                  clientName: client.client_name ?? undefined,
                  locationName: client.location_name ?? undefined,
                  isEdit: true,
                })
              }
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-neutral-tertiary bg-white hover:bg-neutral-quaternary text-dark-1 font-extrabold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Edit Details</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={() =>
              setActiveModalClient({
                clubreadyUserId: client.clubready_user_id!,
                clientName: client.client_name ?? undefined,
                locationName: client.location_name ?? undefined,
                isEdit: false,
              })
            }
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-primary-base hover:bg-primary-base/90 text-white font-extrabold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Add to AbleCare</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20 flex items-center gap-1">
                <HeartPulse className="w-3 h-3" />
                FrontDesk Portal · Integrations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
              AbleCare
            </h1>
            <p className="text-grey-5 text-xs sm:text-sm mt-1 font-medium">
              Manage AbleCare (Able Assess) client onboarding, facilities, and physical assessments across your studio locations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsQuickLookupOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-base hover:bg-primary-base/90 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Look Up / Add by ID</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-quaternary hover:bg-neutral-quaternary/80 text-dark-1 font-extrabold rounded-xl text-xs border border-neutral-tertiary transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin text-primary-base" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-base/10 text-primary-base flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-grey-5">
              Clients Listed
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* On AbleCare */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              On AbleCare
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-0.5">{stats.added}</h3>
          </div>
        </div>

        {/* Needs Add */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Needs AbleCare Add
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-0.5">{stats.needsAdd}</h3>
          </div>
        </div>

        {/* Active Facilities */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-800">
              Active Facilities
            </p>
            <h3 className="text-2xl font-black text-dark-1 mt-0.5">
              {stats.facilitiesCount || locations.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-2" />
            <input
              type="text"
              placeholder="Search by client name, ClubReady ID, instructor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location & Date Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-grey-2 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Pills */}
            <div className="flex items-center gap-1 p-1 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setShowCustomDate(false);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedDate === todayStr && !showCustomDate
                    ? "bg-white text-dark-1 shadow-2xs"
                    : "text-grey-5 hover:text-dark-1"
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(tomorrowStr);
                  setShowCustomDate(false);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedDate === tomorrowStr && !showCustomDate
                    ? "bg-white text-dark-1 shadow-2xs"
                    : "text-grey-5 hover:text-dark-1"
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() => setShowCustomDate(!showCustomDate)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  showCustomDate
                    ? "bg-white text-dark-1 shadow-2xs"
                    : "text-grey-5 hover:text-dark-1"
                }`}
              >
                Custom Date
              </button>
            </div>

            {showCustomDate && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-quaternary/50 border border-neutral-tertiary rounded-xl px-3 py-2 text-xs font-semibold text-dark-1 focus:outline-none focus:border-primary-base transition-all"
              />
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-tertiary/70 pb-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-dark-1 text-white shadow-2xs"
                : "text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary"
            }`}
          >
            All Clients ({uniqueClients.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("needs_add");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "needs_add"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary"
            }`}
          >
            <span>Needs Add</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
              {stats.needsAdd}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("added");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "added"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary"
            }`}
          >
            <span>On AbleCare</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
              {stats.added}
            </span>
          </button>
        </div>

        {/* Table View */}
        <DataTable
          columns={columns}
          data={paginatedClients}
          isLoading={isLoading}
          pagination={{
            pageIndex: validPage - 1,
            pageSize: pageSize,
            pageCount: totalPages,
            totalCount: filteredClients.length,
            onPaginationChange: (state) => {
              setPage(state.pageIndex + 1);
            },
          }}
        />
      </div>

      {/* Add / Edit Individual Modal */}
      {activeModalClient && (
        <AbleCareIndividualModal
          isOpen={Boolean(activeModalClient)}
          onClose={() => setActiveModalClient(null)}
          clubreadyUserId={activeModalClient.clubreadyUserId}
          clientName={activeModalClient.clientName}
          locationName={activeModalClient.locationName}
          isEditMode={activeModalClient.isEdit}
          onSuccess={() => refetch()}
        />
      )}

      {/* Quick Lookup Modal */}
      <AbleCareQuickLookupModal
        isOpen={isQuickLookupOpen}
        onClose={() => setIsQuickLookupOpen(false)}
        onOpenIndividualModal={(id, isEdit, name) => {
          setActiveModalClient({
            clubreadyUserId: id,
            clientName: name,
            isEdit,
          });
        }}
      />
    </div>
  );
};
