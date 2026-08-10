import { Link } from "react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import logo from "../assets/images/stretchnote.png";

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage = ({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this page. Please try refreshing or returning home.",
  onRetry,
}: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-base p-6 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-tertiary shadow-xl p-8 sm:p-10 text-center space-y-6">
        <div className="flex justify-center">
          <img src={logo} alt="StretchNote" className="w-36" />
        </div>

        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-dark-1 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-grey-5 mt-2 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-quaternary hover:bg-neutral-tertiary text-grey-5 border border-neutral-tertiary font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-base hover:bg-opacity-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
