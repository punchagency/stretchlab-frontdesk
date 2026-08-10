export const Spinner = ({ className }: { className?: string }) => {
  return (
    <div
      className={`w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin ${className}`}
    ></div>
  );
};
