import { useQuery } from "@tanstack/react-query";
import { getMyRewards } from "../../service/setting";
import {
  Gift,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";

interface PayoutHistoryItem {
  payout_id: string;
  amount: string;
  status: "sent" | "delivered" | "delivery_failed" | string;
  giftcard_id: string;
  giftcard_name?: string;
  sent_at: string;
}

interface RewardsBalance {
  points: string;
  mention_count: number;
  points_needed: string;
  reward_amount: string;
  active: boolean;
  meets_threshold: boolean;
}

export const MyRewardsTracker = () => {
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["my-rewards-tracker"],
    queryFn: async () => {
      const response = await getMyRewards();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4 mb-8">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="h-24 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !responseData) {
    return null;
  }

  const balance: RewardsBalance | undefined = responseData?.balance;
  const rewards: PayoutHistoryItem[] = responseData?.rewards || [];

  const currentPoints = parseFloat(balance?.points || "0");
  const neededPoints = parseFloat(balance?.points_needed || "1");
  const progressPct = Math.min(
    100,
    Math.max(0, (currentPoints / (neededPoints || 1)) * 100)
  );

  return (
    <div className="space-y-6 mb-8">
      {/* ── Top Balance & Progress Card ───────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden border border-gray-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-base/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Program Inactive Notice */}
        {balance && !balance.active && (
          <div className="flex items-center gap-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl text-xs font-semibold mb-6 animate-in fade-in duration-300">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              The rewards program is currently paused by your studio owner. Earned points are preserved.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Points Display */}
          <div className="space-y-2 lg:border-r border-gray-800 lg:pr-8">
            <div className="flex items-center gap-2 text-primary-light text-xs font-black uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Your Reward Points</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                {currentPoints.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-gray-400">Points Earned</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              From <strong className="text-gray-200">{balance?.mention_count || 0}</strong> confirmed review mentions
            </p>
          </div>

          {/* Progress Bar & Goal */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Reward Goal: ${balance?.reward_amount || "25"} Gift Card
                </span>
                <span className="text-xs text-gray-400">
                  Threshold: {neededPoints} points per payout
                </span>
              </div>
              {balance?.meets_threshold ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Goal Reached! Ready for Payout
                </div>
              ) : (
                <span className="text-xs font-semibold text-primary-light">
                  {(neededPoints - currentPoints).toFixed(1)} more points needed
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3.5 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
              <div
                className="h-full bg-gradient-to-r from-primary-base to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Payout History Section ────────────────────────────────────────── */}
      {rewards.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary-base" />
              <h3 className="text-base font-bold text-gray-900">Your Reward History</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {rewards.length} card{rewards.length > 1 ? "s" : ""} issued
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {rewards.map((item) => {
              const isFailed = item.status === "delivery_failed";
              return (
                <div
                  key={item.payout_id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${isFailed
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                        }`}
                    >
                      ${parseFloat(item.amount).toFixed(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.giftcard_name || "Gift Card"}
                      </p>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.sent_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isFailed ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Delivery Failed - Verify Email with Owner
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Delivered to Email
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
