import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

type Props = {
  label: string;
  icon: "mail" | "lock" | "user";
  type: string;
  placeholder: string;
  value: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
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
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const icons = {
    mail: Mail,
    lock: Lock,
    user: User,
  };

  const Icon = icons[icon];

  return (
    <div>
      <label className="text-sm font-medium text-dark-1 mb-1 block">
        {label}
      </label>
      <div className="flex items-center gap-3 border border-grey-3 rounded-xl py-4 px-3">
        <Icon className="w-4 h-4 text-grey-2 flex-shrink-0" />
        <input
          name={name}
          type={showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="outline-none bg-transparent flex-1 placeholder:text-grey-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete={autoComplete}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-auto text-grey-2 hover:text-grey-5"
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
