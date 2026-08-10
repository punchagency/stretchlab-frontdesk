import React from "react";

interface ContainLoaderProps {
  text?: string;
  className?: string;
}

export const ContainLoader: React.FC<ContainLoaderProps> = ({
  text,
  className = "min-h-[200px]",
}) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-primary-base rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-primary-base rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-primary-base rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
      {text && (
        <p className="text-[10px] font-extrabold text-grey-5 uppercase tracking-wider">
          {text}
        </p>
      )}
    </div>
  );
};
