import { useQuery } from "@tanstack/react-query";
import {
  getIntakeConversionTrend,
  IntakeConversionTrendResponse,
  IntakeConversionTrendPoint,
} from "../../service/home";
import { RotateCcw, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";

const formatWeekEnd = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const renderDot = (strokeColor: string) => (props: any): React.ReactElement<SVGElement> => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) {
    return <g key={`empty-${cx}-${cy}`} />;
  }

  if (payload.in_progress) {
    return (
      <circle
        key={`dot-prog-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#ffffff"
        stroke={strokeColor}
        strokeWidth={2.5}
        strokeDasharray="2 2"
      />
    );
  }

  return (
    <circle
      key={`dot-${cx}-${cy}`}
      cx={cx}
      cy={cy}
      r={4.5}
      fill={strokeColor}
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
};

const TrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as IntakeConversionTrendPoint & { label: string };
    const intakeRate =
      data.first_visits_with_intake_form_rate ?? data.intake_form_submission_rate;

    return (
      <div className="bg-white border border-neutral-tertiary p-4 rounded-2xl shadow-xl text-xs space-y-2.5 min-w-[290px] z-50">
        <div className="border-b border-neutral-tertiary/60 pb-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-dark-1 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-base" />
              Week of {formatWeekEnd(data.week_end)}
            </span>
            {data.in_progress && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                In Progress
              </span>
            )}
          </div>
          <p className="text-[11px] text-grey-5 mt-0.5">
            4-wk window: {formatDateShort(data.window_start)} – {formatDateShort(data.window_end)}
          </p>
        </div>

        <div className="space-y-1.5 text-grey-5">
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-dark-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#368591] shrink-0" />
              Intake Form Rate:
            </span>
            <span className="font-black text-[#368591]">
              {intakeRate !== null && intakeRate !== undefined ? `${intakeRate}%` : "—"}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-dark-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              Conversion (w/ Intake):
            </span>
            <span className="font-black text-emerald-600">
              {data.conversion_rate_with_intake_form !== null &&
                data.conversion_rate_with_intake_form !== undefined
                ? `${data.conversion_rate_with_intake_form}%`
                : "—"}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-tertiary/40">
            <span className="font-semibold text-dark-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              Conversion (w/o Intake):
            </span>
            <span className="font-black text-amber-600">
              {data.conversion_rate_without_intake_form !== null &&
                data.conversion_rate_without_intake_form !== undefined
                ? `${data.conversion_rate_without_intake_form}%`
                : "—"}
            </span>
          </div>

          <div className="pt-1.5 space-y-1 text-[11px] text-grey-5 border-t border-neutral-tertiary/40">
            <div className="flex justify-between">
              <span>First visits with intake form:</span>
              <span className="font-bold text-dark-1">
                {data.first_visits_with_intake_form} of {data.first_visits}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversions with intake:</span>
              <span className="font-bold text-dark-1">
                {data.first_visit_conversions_with_intake_form} of {data.first_visits_with_intake_form}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversions without intake:</span>
              <span className="font-bold text-dark-1">
                {data.first_visit_conversions_without_intake_form} of {data.first_visits_without_intake_form}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total intake forms received:</span>
              <span className="font-bold text-dark-1">{data.intake_form_submissions}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const WEEKS_OPTIONS = [
  { value: "8", label: "8 Weeks" },
  { value: "12", label: "12 Weeks (Default)" },
  { value: "16", label: "16 Weeks" },
  { value: "24", label: "24 Weeks" },
];

export interface IntakeConversionTrendChartProps {
  selectedLocation?: string;
  weeks?: number;
  isSmallScreen?: boolean;
}

export const IntakeConversionTrendChart = ({
  selectedLocation = "All",
  weeks = 12,
  isSmallScreen = false,
}: IntakeConversionTrendChartProps) => {
  const normalizedLocation =
    selectedLocation === "All" || selectedLocation.toLowerCase() === "all"
      ? "all"
      : selectedLocation;

  const {
    data: trendResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<IntakeConversionTrendResponse>({
    queryKey: ["intakeConversionTrendFrontdesk", weeks, normalizedLocation],
    queryFn: () =>
      getIntakeConversionTrend({
        weeks,
        location: normalizedLocation,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const rawPoints =
    normalizedLocation === "all" || !normalizedLocation
      ? trendResponse?.data?.studio || []
      : trendResponse?.data?.locations?.find(
        (l) => l.location_name.toLowerCase() === normalizedLocation.toLowerCase()
      )?.points || trendResponse?.data?.studio || [];

  // Skip leading all-null points to avoid drawing empty pre-history
  const firstActiveIndex = rawPoints.findIndex(
    (p) => p.first_visits > 0 || (p.first_visits_with_intake_form_rate ?? p.intake_form_submission_rate) !== null
  );
  const displayPoints = firstActiveIndex >= 0 ? rawPoints.slice(firstActiveIndex) : rawPoints;

  const chartData = displayPoints.map((p) => ({
    ...p,
    label: formatWeekEnd(p.week_end),
    intake_form_rate: p.first_visits_with_intake_form_rate ?? p.intake_form_submission_rate,
  }));

  const hasNoFormsYet =
    displayPoints.length > 0 &&
    displayPoints.every(
      (p) =>
        (p.first_visits_with_intake_form_rate ?? p.intake_form_submission_rate) === 0 ||
        (p.first_visits_with_intake_form_rate ?? p.intake_form_submission_rate) === null
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-tertiary/60">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm sm:text-base font-black text-dark-1">
              4-Week Rolling Conversion Trend
            </h4>
            <span className="bg-primary-base/10 text-primary-base text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-primary-base/20">
              <TrendingUp className="w-3 h-3" /> Time Series
            </span>
          </div>
          {/* <p className="text-xs text-grey-5 mt-0.5">
            Each point covers the 4-week window ending on Sunday. Compares intake form rate vs. conversion impact over time.
          </p> */}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-grey-5">
          <span className="bg-neutral-quaternary text-dark-1 px-3 py-1.5 rounded-xl border border-neutral-tertiary">
            {weeks} Weeks Window
          </span>

        </div>
      </div>


      {isLoading || (isFetching && !trendResponse) ? (
        <div className="py-20 flex flex-col items-center justify-center text-grey-5 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base" />
          <p className="text-xs font-black uppercase tracking-wider">Loading rolling trend metrics...</p>
        </div>
      ) : error ? (
        <div className="py-12 flex flex-col items-center justify-center text-red-500 space-y-3">
          <p className="text-sm font-semibold">Failed to load intake conversion trend data.</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-primary-base text-white hover:bg-primary-base/90 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="py-12 text-center text-grey-5">
          <p className="text-sm font-black text-dark-1">No trend data available</p>
          <p className="text-xs text-grey-5 mt-1">
            There is no first visit activity recorded for this period.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hasNoFormsYet && (
            <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No intake forms have been submitted for this location yet. The intake conversion line will appear once clients complete forms.
              </span>
            </div>
          )}

          <div className="h-[440px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 15,
                  right: isSmallScreen ? 15 : 30,
                  left: isSmallScreen ? 15 : 20,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  dy={8}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  width={42}
                />
                <RechartsTooltip
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={<TrendTooltip />}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 700 }}
                />
                <Line
                  type="monotone"
                  dataKey="intake_form_rate"
                  name="Intake Form Rate"
                  stroke="#368591"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={renderDot("#368591") as any}
                  activeDot={{ r: 8, stroke: "#368591", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="conversion_rate_with_intake_form"
                  name="Conversion (w/ Intake)"
                  stroke="#059669"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={renderDot("#059669") as any}
                  activeDot={{ r: 8, stroke: "#059669", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="conversion_rate_without_intake_form"
                  name="Conversion (w/out Intake)"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  connectNulls={false}
                  dot={renderDot("#d97706") as any}
                  activeDot={{ r: 7, stroke: "#d97706", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-grey-5 pt-2 border-t border-neutral-tertiary/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#368591] bg-white" />
                Hollow dot = Current week in progress (updates daily)
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
