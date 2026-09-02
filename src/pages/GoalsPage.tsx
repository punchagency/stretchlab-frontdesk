import { Target } from "lucide-react";

export const GoalsPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-base/10 text-primary-base border border-primary-base/20">
              Future Module
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
            Client Goals &amp; Milestone Tracking
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-grey-5 mt-1">
            Track client progress, 90-day goal reviews, and milestone assessments
          </p>
        </div>
      </div>

      {/* Placeholder Body */}
      <div className="bg-white rounded-3xl border border-neutral-tertiary p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs py-24">
        <div className="w-20 h-20 rounded-3xl bg-primary-base/10 text-primary-base flex items-center justify-center shadow-inner">
          <Target className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-xl font-black text-dark-1">90-Day Goals Tracking — Coming Soon</h3>
          {/* <p className="text-xs text-grey-5 font-medium leading-relaxed">
            We are working on bringing full 90-day goal tracking and milestone review automation to the FrontDesk portal. Stay tuned!
          </p> */}
        </div>
        {/* <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-quaternary text-grey-5 font-bold text-xs border border-neutral-tertiary">
          <Sparkles className="w-4 h-4 text-primary-base" />
          Planned Release
        </div> */}
      </div>
    </div>
  );
};
