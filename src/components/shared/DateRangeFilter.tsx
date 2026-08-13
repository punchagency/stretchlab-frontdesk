import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export interface DurationOption {
  value: string;
  label: string;
}

interface DateRangeFilterProps {
  label?: string;
  value: string;
  options: DurationOption[];
  onChange: (value: string) => void;
  onCustomRangeChange?: (start: string, end: string) => void;
  className?: string;
  showLabel?: boolean;
  inputClassName?: string;
}

export const DateRangeFilter = ({
  label,
  value,
  options,
  onChange,
  onCustomRangeChange,
  className = "",
  showLabel = true,
  inputClassName = "",
}: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleOptionClick = (option: DurationOption) => {
    if (option.value === "custom") {
      setShowDatePicker(true);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setShowDatePicker(false);
    }
  };

  const handleCustomRangeSubmit = () => {
    if (startDate && endDate && onCustomRangeChange) {
      onCustomRangeChange(startDate, endDate);
      onChange("custom");
      setIsOpen(false);
      setShowDatePicker(false);
    }
  };

  const handleCancel = () => {
    setShowDatePicker(false);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base transition-colors ${inputClassName}`}
        >
          <span className="truncate pr-2">{value}</span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
              <div className="p-2">
                {!showDatePicker ? (
                  options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full px-3 py-2 text-left text-sm focus:outline-none transition-colors rounded-sm ${
                        option.value === value
                          ? "bg-primary-base text-white"
                          : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="p-3 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4" />
                      Select Date Range
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCustomRangeSubmit}
                        disabled={!startDate || !endDate}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-base rounded-md hover:bg-primary-base/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
