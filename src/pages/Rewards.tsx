import { GiftCardSettings, MyRewardsTracker } from "../components/forms";
import { Navigate } from "react-router";
import { getUserCookie } from "../utils/user";

export const Rewards = () => {
  const token = getUserCookie();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28">
      <MyRewardsTracker />
      <GiftCardSettings />
    </div>
  );
};
