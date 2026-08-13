import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface LocationOption {
  location_id: string;
  location_name: string;
}

interface FilterDropdownProps {
  label?: string;
  value: string;
  options: (string | FilterOption | LocationOption)[];
  onChange: (value: string) => void;
  className?: string;
  showLabel?: boolean;
  showSearch?: boolean;
  placeholder?: string;
}

export const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  className = "",
  showLabel = true,
  showSearch = false,
  placeholder = "Select an option",
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedOptions: FilterOption[] = options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    if (typeof option === "object" && "location_name" in option) {
      return { value: option.location_name, label: option.location_name };
    }
    return option as FilterOption;
  });

  const sortOptionsWithSpecialFirst = (optionsToSort: FilterOption[]) => {
    const specialOptions = ["All", "all"];
    const special = optionsToSort.filter((option) =>
      specialOptions.includes(option.value)
    );
    const regular = optionsToSort
      .filter((option) => !specialOptions.includes(option.value))
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    return [...special, ...regular];
  };

  const filteredOptions =
    showSearch && searchTerm
      ? sortOptionsWithSpecialFirst(
          normalizedOptions.filter((option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : sortOptionsWithSpecialFirst([...normalizedOptions]);

  const currentOption = normalizedOptions.find((option) => option.value === value);
  const displayValue = currentOption ? currentOption.label : value || placeholder;

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base transition-colors"
        >
          <span className="truncate pr-2 capitalize">{displayValue}</span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={handleClose} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                {showSearch && (
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-base focus:border-primary-base"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        handleClose();
                      }}
                      className={`w-full px-3 py-2 text-left text-sm focus:outline-none transition-colors rounded-sm capitalize ${
                        option.value === value
                          ? "bg-primary-base text-white"
                          : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No options found
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
