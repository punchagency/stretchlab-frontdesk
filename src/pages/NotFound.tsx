import { Link } from "react-router";

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-base p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-base mb-4">404</h1>
        <p className="text-xl text-dark-1 mb-8">Page not found</p>
        <Link 
          to="/rewards" 
          className="bg-primary-base text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
        >
          Back to Rewards
        </Link>
      </div>
    </div>
  );
};
