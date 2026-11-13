import logo from "../../assets/images/stretchnote.png";

// Shown briefly while the session is restored from the refresh token.
export const SessionRestoreScreen = () => (
  <div
    role="status"
    aria-live="polite"
    className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-primary-light antialiased"
  >
    {/* Soft brand-coloured background shapes */}
    <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-primary-secondary blur-3xl opacity-80" />
    <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary-tertiary/30 blur-3xl" />
    <div className="pointer-events-none absolute top-1/4 left-[12%] h-24 w-16 rounded-2xl bg-primary-base/10 rotate-12" />
    <div className="pointer-events-none absolute bottom-1/4 right-[14%] h-20 w-32 rounded-t-full bg-primary-tertiary/20" />

    <div className="relative z-10 flex w-[90%] max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/80 px-8 py-10 shadow-[0_10px_40px_rgba(54,133,145,0.12)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Stretchnote" className="w-36 sm:w-40" />
        <span className="text-[10px] font-black uppercase tracking-wider bg-primary-base/10 text-primary-base px-2.5 py-0.5 rounded-full border border-primary-base/20 shrink-0">
          Desk
        </span>
      </div>

      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary-secondary" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary-base border-r-primary-tertiary" />
        <div className="absolute inset-[18px] animate-pulse rounded-full bg-primary-base/80" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-base font-semibold tracking-custom text-dark-1">
          Restoring your session
        </p>
        <p className="text-sm text-grey-5">Hang tight, this only takes a moment…</p>
      </div>
    </div>
  </div>
);

