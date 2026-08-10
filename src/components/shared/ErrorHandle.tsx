import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorHandleProps {
  message?: string;
  retry?: () => void;
  className?: string;
}

export const ErrorHandle = ({
  message = "An error occurred while fetching data.",
  retry,
  className = "py-16",
}: ErrorHandleProps) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-neutral-tertiary shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-black text-dark-1">Unable to Load Data</h3>
      <p className="text-xs text-grey-5 mt-1 max-w-sm font-medium">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-base hover:bg-opacity-95 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
