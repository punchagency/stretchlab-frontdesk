import { useState } from "react";
import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getIntakeFormConversion,
  getFrontdeskHome,
  IntakeFormConversionResponse,
  IntakeFormLocation,
} from "../service/home";
import { getUserCookie } from "../utils/user";
import { DateRangeFilter, FilterDropdown, DurationOption } from "../components/shared";
import {
  RotateCcw,
  FileText,
  CheckCircle2,
  Users,
  TrendingUp,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const DURATION_OPTIONS: DurationOption[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

const CustomBar = (props: any) => {
  const { payload, x, y, width, height } = props;

  if (
    !payload ||
    typeof payload.value !== "number" ||
    isNaN(payload.value) ||
    typeof x !== "number" ||
    isNaN(x) ||
    typeof y !== "number" ||
    isNaN(y) ||
    typeof width !== "number" ||
    isNaN(width) ||
    typeof height !== "number" ||
    isNaN(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return <g />;
  }

  const brickHeight = 20;
  const numBricks = Math.floor(height / brickHeight);

  const bricks = [];
  for (let i = 0; i < numBricks; i++) {
    const brickY = y + height - (i + 1) * brickHeight;
    const gradientId = `intakeBrickGradient-${i}-${x}`;

    bricks.push(
      <g key={`brick-${i}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#368591" />
            <stop offset="30%" stopColor="#368591" />
            <stop offset="100%" stopColor="#368591" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={brickY}
          width={width}
          height={brickHeight}
          fill={`url(#${gradientId})`}
        />
      </g>
    );
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="transparent" />
      {bricks}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-neutral-tertiary p-4 rounded-2xl shadow-xl text-xs space-y-2.5 min-w-[270px] z-50">
        <p className="font-extrabold text-dark-1 text-sm border-b border-neutral-tertiary/60 pb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary-base" />
          {data.location_name}
        </p>
        <div className="space-y-1.5 text-grey-5">
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-grey-5">Intake Submission Rate:</span>
            <span className="font-black text-primary-base text-xs">
              {data.intake_form_submission_rate}%
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-emerald-700">Conversion (With Intake):</span>
            <span className="font-black text-emerald-600 text-xs">
              {data.conversion_rate_with_intake_form}%
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-amber-700">Conversion (No Intake):</span>
            <span className="font-black text-amber-600 text-xs">
              {data.conversion_rate_without_intake_form}%
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 text-[11px] text-grey-5">
            <span>Conversions (With / Without Intake):</span>
            <span className="font-bold text-dark-1">
              {data.first_visit_conversions_with_intake_form} / {data.first_visit_conversions_without_intake_form}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 text-[11px] text-grey-5">
            <span>Visits (With / Without Intake):</span>
            <span className="font-bold text-dark-1">
              {data.first_visits_with_intake_form} / {data.first_visits_without_intake_form}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 text-[11px] text-grey-5">
            <span>Total Visits / Submissions:</span>
            <span className="font-bold text-dark-1">
              {data.first_visits} / {data.intake_form_submissions}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const IntakeConversion = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const token = getUserCookie();

  const [duration, setDuration] = useState("this_month");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(
    null
  );

  const { data: homeData } = useQuery({
    queryKey: ["frontdeskHomeLocations"],
    queryFn: () => getFrontdeskHome({ page: 1, page_size: 1 }),
    enabled: !!token,
  });

  const locations = (homeData?.data?.data?.locations || []).map(
    (l) => l.location_name
  );

  const {
    data: conversionResponse,
    isLoading,
    isFetching,
    isRefetching,
    error,
    refetch,
  } = useQuery<IntakeFormConversionResponse>({
    queryKey: ["intakeFormConversion", duration, selectedLocation, customRange],
    queryFn: () =>
      getIntakeFormConversion({
        duration,
        location: selectedLocation,
        startDate: duration === "custom" ? customRange?.start : undefined,
        endDate: duration === "custom" ? customRange?.end : undefined,
      }),
    enabled: !!token,
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const conversionData = conversionResponse?.data;
  const locationOptions = ["All", ...locations.filter((l) => l !== "All")];

  const handleCustomRangeChange = (start: string, end: string) => {
    setCustomRange({ start, end });
    setDuration("custom");
  };

  const chartData = (conversionData?.locations || [])
    .filter(
      (loc: IntakeFormLocation) =>
        loc.first_visits > 0 || loc.intake_form_submissions > 0
    )
    .map((loc: IntakeFormLocation) => ({
      name: loc.location_name,
      location_name: loc.location_name,
      intake_form_submission_rate: loc.intake_form_submission_rate ?? loc.conversion_percentage ?? 0,
      conversion_rate_with_intake_form: loc.conversion_rate_with_intake_form ?? loc.matched_conversion_percentage ?? 0,
      conversion_rate_without_intake_form: loc.conversion_rate_without_intake_form ?? 0,
      first_visits_with_intake_form: loc.first_visits_with_intake_form ?? loc.first_visits_from_intake_form ?? 0,
      first_visit_conversions_with_intake_form: loc.first_visit_conversions_with_intake_form ?? 0,
      first_visits_without_intake_form: loc.first_visits_without_intake_form ?? 0,
      first_visit_conversions_without_intake_form: loc.first_visit_conversions_without_intake_form ?? 0,
      first_visits: loc.first_visits,
      intake_form_submissions: loc.intake_form_submissions,
      value: loc.conversion_rate_with_intake_form ?? loc.matched_conversion_percentage ?? 0,
    }));

  return (
    <div className={hideHeader ? "space-y-6" : "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6"}>
      {/* Header Banner */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Analytics &amp; Performance
              </span>
              {(conversionData?.matched_by_client_id !== undefined || conversionData?.matched_by_name !== undefined) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-grey-5 bg-neutral-quaternary px-2.5 py-1 rounded-full border border-neutral-tertiary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-base"></span>
                  {conversionData.matched_by_client_id ?? 0} ID Matches · {conversionData.matched_by_name ?? 0} Name Matches
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
              Form Conversion Rate
            </h1>
            <p className="text-grey-5 text-xs sm:text-sm mt-1">
              Live overview of digital intake form completion rate measured against completed 1st visits.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching || isFetching}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 font-bold rounded-xl text-xs transition-all cursor-pointer border border-neutral-tertiary active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-4 h-4 ${isRefetching || isFetching ? "animate-spin text-primary-base" : ""}`}
            />
            {isRefetching || isFetching ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-tertiary shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-base" />
          <span className="text-xs font-black text-dark-1 uppercase tracking-wider">
            Conversion Overview
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter
            label="Duration"
            value={
              DURATION_OPTIONS.find((opt) => opt.value === duration)?.label || duration
            }
            options={DURATION_OPTIONS}
            onChange={(val) => setDuration(val)}
            onCustomRangeChange={handleCustomRangeChange}
            showLabel={false}
            className="w-44"
          />
          <FilterDropdown
            label="Location"
            value={selectedLocation}
            options={locationOptions}
            onChange={(val) => setSelectedLocation(val)}
            showLabel={false}
            className="w-44"
            showSearch={true}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading || (isFetching && !conversionData) ? (
        <div className="py-16 bg-white rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col items-center justify-center text-grey-5 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base"></div>
          <p className="text-xs font-extrabold uppercase tracking-wider">
            Loading conversion metrics...
          </p>
        </div>
      ) : error ? (
        <div className="py-12 bg-white rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col items-center justify-center text-red-500">
          <p className="mb-3 text-sm font-semibold">Failed to load intake form conversion metrics.</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-primary-base text-white hover:bg-primary-base/90 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics Rollup Row */}
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Card 1: Intake Submission Rate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs cursor-help hover:border-primary-base/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-base">
                          Intake Submission Rate
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-primary-base/10 text-primary-base border border-primary-base/20 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark-1 mb-1">
                        {conversionData?.intake_form_submission_rate !== undefined
                          ? `${conversionData.intake_form_submission_rate}%`
                          : conversionData?.conversion_percentage !== undefined
                            ? `${conversionData.conversion_percentage}%`
                            : "0%"}
                      </h3>
                      <p className="text-[10px] text-grey-5 font-medium">
                        Submissions / First Visits
                      </p>
                    </div>
                    <div className="mt-3 w-full bg-neutral-quaternary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary-base h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            conversionData?.intake_form_submission_rate ?? conversionData?.conversion_percentage ?? 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  Count of Intake Form Submissions / Count of First Visits.
                </TooltipContent>
              </Tooltip>

              {/* Card 2: Conversion Rate WITH Intake Form */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs cursor-help hover:border-emerald-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                          Conversion Rate (With Intake)
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark-1 mb-1">
                        {conversionData?.conversion_rate_with_intake_form !== undefined
                          ? `${conversionData.conversion_rate_with_intake_form}%`
                          : `${conversionData?.matched_conversion_percentage ?? 0}%`}
                      </h3>
                      <p className="text-[10px] text-grey-5 font-medium truncate">
                        {conversionData?.first_visit_conversions_with_intake_form ?? 0} converted / {conversionData?.first_visits_with_intake_form ?? conversionData?.first_visits_from_intake_form ?? 0} visits
                      </p>
                    </div>
                    <div className="mt-3 w-full bg-emerald-50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            conversionData?.conversion_rate_with_intake_form ?? conversionData?.matched_conversion_percentage ?? 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] text-xs space-y-1">
                  <p>Count of First Visit Conversions with Intake Form / Count of First Visits with Intake Form Submitted.</p>
                  {(conversionData?.matched_by_client_id !== undefined || conversionData?.matched_by_name !== undefined) && (
                    <p className="text-[11px] text-primary-base pt-1 border-t border-neutral-tertiary/60 font-semibold">
                      {conversionData.matched_by_client_id ?? 0} ID matches, {conversionData.matched_by_name ?? 0} name matches.
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Card 3: Conversion Rate WITHOUT Intake Form */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs cursor-help hover:border-amber-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                          Conversion Rate (No Intake)
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark-1 mb-1">
                        {conversionData?.conversion_rate_without_intake_form !== undefined
                          ? `${conversionData.conversion_rate_without_intake_form}%`
                          : "0%"}
                      </h3>
                      <p className="text-[10px] text-grey-5 font-medium truncate">
                        {conversionData?.first_visit_conversions_without_intake_form ?? 0} converted / {conversionData?.first_visits_without_intake_form ?? 0} visits
                      </p>
                    </div>
                    <div className="mt-3 w-full bg-amber-50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            conversionData?.conversion_rate_without_intake_form ?? 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs">
                  Count of First Visit Conversions without Intake Form / Count of First Visits without Intake Form Submitted.
                </TooltipContent>
              </Tooltip>

              {/* Card 4: Total First Visits */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs cursor-help hover:border-primary-base/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-grey-5">
                          Total First Visits
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-neutral-quaternary text-dark-1 border border-neutral-tertiary flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-grey-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark-1">
                        {conversionData?.first_visits ?? 0}
                      </h3>
                    </div>
                    <p className="text-[10px] text-grey-5 mt-2 font-medium">
                      1st visits logged complete
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  Total 1st visit appointment bookings logged as completed.
                </TooltipContent>
              </Tooltip>

              {/* Card 5: Form Submissions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-tertiary shadow-xs cursor-help hover:border-primary-base/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-grey-5">
                          Intake Submissions
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-neutral-quaternary text-dark-1 border border-neutral-tertiary flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary-base" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-dark-1">
                        {conversionData?.intake_form_submissions ?? 0}
                      </h3>
                    </div>
                    <p className="text-[10px] text-grey-5 mt-2 font-medium">
                      Total forms submitted
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  Total digital intake forms submitted by clients in the selected period.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>


          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-tertiary shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-tertiary/60 pb-4">
                <div>
                  <h3 className="text-base font-black text-dark-1">
                    Conversion Rate by Studio Location
                  </h3>
                  <p className="text-grey-5 text-xs mt-0.5">
                    Percentage of first-time visits matched to digital intake forms per location.
                  </p>
                </div>
              </div>

              <div className="h-[380px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    barCategoryGap="5%"
                  >
                    <CartesianGrid stroke="none" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                      width={35}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      fill="#368591"
                      maxBarSize={550}
                      shape={<CustomBar />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  );
};
