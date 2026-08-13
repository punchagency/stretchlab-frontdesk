import logo from "../assets/images/stretchnote.png";
import model from "../assets/images/model.png";
import { LoginForm } from "../components/forms/LoginForm";
import { Building2 } from "lucide-react";

export const Login = () => {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-neutral-base/50 antialiased">
      <div className="flex flex-col xl:flex-row max-w-7xl mx-auto gap-8 sm:gap-12 p-4 sm:p-6 overflow-hidden w-full items-center">

        {/* Left Form Section */}
        <div className="w-full xl:w-1/2 flex flex-col justify-center max-w-md mx-auto xl:max-w-none">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xl space-y-5">

            {/* Header / Brand */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="StretchNote" className="w-36 sm:w-44" />
                  <span className="text-[10px] font-black uppercase tracking-wider bg-primary-base/10 text-primary-base px-2.5 py-0.5 rounded-full border border-primary-base/20 shrink-0">
                    Desk
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-dark-1">
                  Welcome Back!
                </h1>
                <p className="text-xs sm:text-sm leading-relaxed text-grey-5 mt-1">
                  Log in to access live studio intake submissions and client check-in tools.
                </p>
              </div>


            </div>

            {/* Login Form */}
            <LoginForm />

          </div>
        </div>

        {/* Right Hero Section with Front Desk Overlay Card */}
        <div className="bg-primary-secondary md:w-full xl:w-1/2 hidden md:flex xl:flex justify-center items-center relative rounded-3xl overflow-hidden min-h-[440px] xl:min-h-[480px] shadow-lg">
          {/* Top Badge */}
          <div className="absolute top-6 right-6 z-30 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black text-primary-base border border-primary-base/20 shadow-xs uppercase tracking-wider">
            Front Desk Portal
          </div>

          <img
            src={model}
            alt="StretchLab Model"
            className="w-[65%] mx-auto z-20 object-contain drop-shadow-xl"
          />

          {/* Decorative shapes */}
          <div className="absolute bg-primary-base md:w-[70px] md:h-[100px] xl:w-[100px] xl:h-[140px] rounded-2xl xl:top-24 md:top-10 xl:right-12 md:right-16 shadow-md opacity-90" />
          <div className="absolute md:hidden xl:block bg-[#EFE7FF] w-[75%] h-[47px] bottom-24 left-1/2 -translate-x-1/2 rounded-full opacity-80" />
          <div className="absolute bg-primary-tertiary md:w-[30%] md:h-[200px] xl:w-[43%] xl:h-[250px] xl:top-[55%] md:top-[50%] -translate-y-1/2 left-1/2 -translate-x-1/2 rounded-t-full shadow-xs" />

          {/* Floating Operational Card at Bottom Left */}
          <div className="absolute bottom-6 left-6 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-tertiary shadow-xl max-w-[260px] space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-base" />
                <span className="text-[11px] font-black text-dark-1 uppercase tracking-wider">
                  Front Desk Hub
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] font-semibold text-grey-5 leading-tight">
              Live intake form matching & instant client lookup for your studio.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
