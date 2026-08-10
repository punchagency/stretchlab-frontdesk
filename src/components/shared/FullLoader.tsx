export const FullLoader = ({ text }: { text: string }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-300 bg-opacity-50 z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex space-x-2">
          <div className="w-4 h-4 bg-primary-base rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-primary-base rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-4 h-4 bg-primary-base rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="text-base font-medium text-grey-5">{text}</p>
      </div>
    </div>
  );
};
