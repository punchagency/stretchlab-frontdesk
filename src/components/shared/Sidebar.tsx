import { Link, useLocation, useNavigate } from "react-router";
import { Home, Gift, LogOut, X } from "lucide-react";
import logo from "../../assets/images/stretchnote.png";
import { deleteUserCookie, getUserInfo } from "../../utils/user";
import { logout } from "../../service/auth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    title: "Intake Submissions",
    path: "/",
    icon: Home,
  },
  {
    title: "Reward Selection",
    path: "/rewards",
    icon: Gift,
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Proceed even if network request fails
    } finally {
      deleteUserCookie();
      navigate("/login");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const displayName =
    userInfo?.name ||
    userInfo?.username ||
    userInfo?.clubready_accounts?.[0]?.name ||
    "Front Desk";

  const userEmail = userInfo?.email || "frontdesk@stretchnote.com";

  const sidebarContent = (
    <aside className="w-72 h-full bg-white border-r border-neutral-tertiary flex flex-col overflow-hidden shadow-2xl md:shadow-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-neutral-tertiary/40">
        <div className="flex items-center gap-2">
          <img src={logo} alt="StretchNote" className="w-32" />
          <span className="text-[10px] font-black uppercase tracking-wider bg-primary-base/10 text-primary-base px-2 py-0.5 rounded-full border border-primary-base/20">
            Desk
          </span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${active
                ? "bg-primary-base text-white font-bold shadow-md shadow-primary-base/20"
                : "text-grey-5 hover:bg-neutral-quaternary hover:text-dark-1"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : "text-grey-2 group-hover:text-primary-base"
                    }`}
                />
                <span className="text-sm tracking-tight">{item.title}</span>
              </div>

            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-neutral-tertiary space-y-3">
        <div className="flex items-center gap-3 p-3 bg-neutral-quaternary/40 rounded-2xl border border-neutral-tertiary/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-base to-primary-base text-white flex items-center justify-center font-black text-sm uppercase shadow-sm">
            {displayName.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-dark-1 truncate capitalize">{displayName}</p>
            <p className="text-[10px] text-grey-5 truncate font-mono">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-100 transition-all font-bold text-xs cursor-pointer group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Logout Account
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
