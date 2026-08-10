import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { getUserInfo, deleteUserCookie } from "../../utils/user";
import { logout } from "../../service/auth";
import { renderErrorToast } from "../../utils/toast";
import logo from "../../assets/images/stretchnote.png";


export const Header = () => {
  const navigate = useNavigate();
  const user = getUserInfo();
  const displayName = user?.clubready_accounts?.[0]?.name || "Front Desk";

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // proceed even if API call fails
    } finally {
      deleteUserCookie();
      navigate("/login");
    }
  };

  const handleLogoutClick = () => {
    handleLogout().catch(() => {
      renderErrorToast("Logout failed. Please try again.");
    });
  };

  return (
    <header className="flex items-center justify-between border-b border-neutral-tertiary py-4 px-6 bg-white sticky top-0 z-40">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="logo" className="w-36 mx-auto" />

      </div>

      {/* User + Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-base text-white rounded-full flex items-center justify-center font-semibold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-dark-1 hidden tablet:block capitalize">
            {displayName}
          </span>
        </div>
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-1.5 text-sm font-medium text-grey-5 hover:text-accent-base transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden tablet:block">Logout</span>
        </button>
      </div>
    </header>
  );
};
