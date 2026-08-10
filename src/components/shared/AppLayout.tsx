import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Sparkles } from "lucide-react";
import logo from "../../assets/images/stretchnote.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-base flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-tertiary sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-grey-5 hover:text-dark-1 hover:bg-neutral-quaternary rounded-xl transition-all"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={logo} alt="StretchNote" className="w-28" />
        </div>
        <div className="flex items-center gap-1 bg-primary-base/10 text-primary-base px-2.5 py-1 rounded-full text-[10px] font-black">
          <Sparkles className="w-3 h-3" />
          FrontDesk
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
