import React from "react";

export interface KpiSummaryCardProps {
  title: string;
  count: number | string;
  subText?: string;
  icon: React.ElementType;
  tone?: "default" | "primary" | "rose" | "slate" | "indigo" | "purple";
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KpiSummaryCard: React.FC<KpiSummaryCardProps> = ({
  title,
  count,
  subText,
  icon: Icon,
  tone = "default",
  isActive = false,
  onClick,
  className = "",
}) => {
  const getToneStyles = () => {
    switch (tone) {
      case "primary":
        return {
          titleColor: "text-primary-base",
          countColor: "text-primary-base",
          iconColor: "text-primary-base",
          iconBg: "bg-primary-base/10",
          activeBg: "bg-primary-base/5 border-primary-base ring-2 ring-primary-base/20",
        };
      case "rose":
        return {
          titleColor: "text-rose-700",
          countColor: "text-rose-600",
          iconColor: "text-rose-600",
          iconBg: "bg-rose-100/60",
          activeBg: "bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/20",
        };
      case "slate":
        return {
          titleColor: "text-slate-700",
          countColor: "text-slate-800",
          iconColor: "text-slate-600",
          iconBg: "bg-slate-100",
          activeBg: "bg-slate-50 border-slate-500 ring-2 ring-slate-500/20",
        };
      case "indigo":
        return {
          titleColor: "text-indigo-700",
          countColor: "text-indigo-700",
          iconColor: "text-indigo-600",
          iconBg: "bg-indigo-100/60",
          activeBg: "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20",
        };
      case "purple":
        return {
          titleColor: "text-purple-700",
          countColor: "text-purple-700",
          iconColor: "text-purple-600",
          iconBg: "bg-purple-100/60",
          activeBg: "bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20",
        };
      default:
        return {
          titleColor: "text-grey-5",
          countColor: "text-dark-1",
          iconColor: "text-grey-5",
          iconBg: "bg-neutral-quaternary",
          activeBg: "bg-white border-primary-base ring-2 ring-primary-base/20",
        };
    }
  };

  const styles = getToneStyles();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 min-h-[120px] rounded-2xl border text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between ${
        isActive
          ? `${styles.activeBg} shadow-sm`
          : "bg-white border-neutral-tertiary hover:border-grey-2/50"
      } ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-[11px] font-black uppercase tracking-wider ${styles.titleColor}`}
        >
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${styles.iconBg}`}
        >
          <Icon className={`w-4 h-4 ${styles.iconColor}`} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-2xl sm:text-3xl font-black ${styles.countColor}`}>
          {count}
        </span>
        {subText && (
          <span className="text-[11px] text-grey-5 font-bold leading-tight">
            {subText}
          </span>
        )}
      </div>
    </button>
  );
};
