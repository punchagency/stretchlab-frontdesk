import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Search } from "lucide-react";

type Props = {
  label?: string;
  icon?: "mail" | "lock" | "user" | "search";
  type: string;
  placeholder?: string;
  value: string;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
};

export const Input = ({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  name,
  disabled,
  autoComplete,
  className = "",
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const icons = {
    mail: Mail,
    lock: Lock,
    user: User,
    search: Search,
  };

  const Icon = icon ? icons[icon] : null;

  return (
    <div className={className}>
      {label && (
        <label className="text-xs sm:text-sm font-bold text-dark-1 mb-1 block">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2.5 border border-neutral-tertiary rounded-xl py-2.5 px-3 bg-white transition-all focus-within:border-primary-base focus-within:ring-1 focus-within:ring-primary-base shadow-2xs">
        {Icon && <Icon className="w-4 h-4 text-grey-5 flex-shrink-0" />}
        <input
          name={name}
          type={showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="outline-none bg-transparent flex-1 placeholder:text-grey-2 text-xs sm:text-sm text-dark-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete={autoComplete}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-auto text-grey-5 hover:text-dark-1"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
