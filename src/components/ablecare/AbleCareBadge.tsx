import React from "react";
import { Check, Plus, Edit2, ShieldCheck, HeartPulse } from "lucide-react";
import { AbleCareBadgeStatus } from "../../service/ablecare";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface AbleCareBadgeProps {
  ableCare?: AbleCareBadgeStatus | null;
  clubreadyUserId?: string | number | null;
  onAddClick?: (e?: React.MouseEvent) => void;
  onEditClick?: (e?: React.MouseEvent) => void;
  size?: "sm" | "md";
  showActionButtons?: boolean;
  showIcon?: boolean;
}

const formatDateTime = (stamp?: string | null) => {
  if (!stamp) return "";
  try {
    const d = new Date(stamp.endsWith("Z") ? stamp : stamp + "Z");
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return stamp;
  }
};

export const AbleCareBadge: React.FC<AbleCareBadgeProps> = ({
  ableCare,
  clubreadyUserId,
  onAddClick,
  onEditClick,
  size = "md",
  showActionButtons = true,
  showIcon = true,
}) => {
  if (!clubreadyUserId && !ableCare?.added) {
    return (
      <span
        className={`inline-flex items-center rounded-lg border border-neutral-tertiary bg-neutral-quaternary/50 text-grey-2 font-bold ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          }`}
      >
        <span>No Client ID</span>
      </span>
    );
  }

  const isAdded = Boolean(ableCare?.added);
  const facilityName = ableCare?.facility_name || "Assigned Facility";

  if (isAdded) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`inline-flex items-center gap-1.5 rounded-xl font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs select-none transition-colors hover:bg-emerald-100/70 cursor-default ${size === "sm"
                    ? "px-2.5 py-1 text-[11px]"
                    : "px-3 py-1 text-xs"
                  }`}
              >
                {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                <span className="truncate max-w-[170px]">
                  On AbleCare · {facilityName}
                </span>
                {showIcon && <Check className="w-3 h-3 text-emerald-700 shrink-0" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs p-2.5 max-w-xs shadow-md">
              <div className="space-y-1">
                <p className="font-extrabold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Active in AbleCare
                </p>
                <p className="text-[11px] text-white">
                  <strong>Facility:</strong> {facilityName}
                </p>
                {ableCare?.staff_name && (
                  <p className="text-[11px] text-white">
                    <strong>Added By:</strong> {ableCare.staff_name}
                  </p>
                )}
                {ableCare?.added_at && (
                  <p className="text-[10px] text-white">
                    <strong>Added At:</strong> {formatDateTime(ableCare.added_at)}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showActionButtons && onEditClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(e);
            }}
            className={`inline-flex items-center gap-1 rounded-xl border border-neutral-tertiary bg-white hover:bg-neutral-quaternary/70 text-dark-1 font-bold shadow-2xs transition-all active:scale-95 cursor-pointer ${size === "sm"
                ? "px-2 py-0.5 text-[10px]"
                : "px-2.5 py-1 text-xs"
              }`}
            title="Edit AbleCare details"
          >
            <Edit2 className="w-3 h-3 text-grey-5" />
            <span>Edit</span>
          </button>
        )}
      </div>
    );
  }

  // Not on AbleCare yet
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 rounded-xl border border-neutral-tertiary bg-neutral-quaternary text-grey-5 font-bold ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
          }`}
      >
        {showIcon && <HeartPulse className="w-3.5 h-3.5 text-grey-2 shrink-0" />}
        <span>Not on AbleCare</span>
      </span>

      {showActionButtons && onAddClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddClick(e);
          }}
          className={`inline-flex items-center gap-1 rounded-xl bg-primary-base hover:bg-primary-base/90 text-white font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer ${size === "sm"
              ? "px-2.5 py-0.5 text-[10px]"
              : "px-3 py-1 text-xs"
            }`}
          title="Add client to AbleCare"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to AbleCare</span>
        </button>
      )}
    </div>
  );
};

