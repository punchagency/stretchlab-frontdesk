import logo from "../assets/images/stretchnote.png";
import model from "../assets/images/model.png";
import { LoginForm } from "../components/forms/LoginForm";

export const Login = () => {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 sm:p-6">
      <div className="flex flex-col xl:flex-row max-w-7xl mx-auto gap-8 sm:gap-12 p-6 overflow-hidden">
        {/* Left Form Section */}
        <div className="w-full xl:w-1/2 flex flex-col gap-4 justify-center py-4">
          <img src={logo} alt="StretchNote" className="w-64 mx-auto mb-2" />
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-center text-dark-1">
            Welcome Back!
          </h1>
          <p className="text-xs sm:text-sm xl:text-base leading-relaxed text-grey-5 text-center max-w-md mx-auto">
            Log in to Frontdesk Portal.
          </p>
          <LoginForm />
        </div>

        {/* Right Hero Section */}
        <div className="bg-primary-secondary md:w-full xl:w-1/2 hidden md:flex xl:flex justify-center items-center relative rounded-3xl overflow-hidden min-h-[380px]">
          <img src={model} alt="StretchLab Model" className="w-[70%] mx-auto z-20 object-contain drop-shadow-xl" />
          <div className="absolute bg-primary-base md:w-[70px] md:h-[100px] xl:w-[100px] xl:h-[140px] rounded-2xl xl:top-24 md:top-10 xl:right-12 md:right-16 shadow-md opacity-90" />
          <div className="absolute md:hidden xl:block bg-[#EFE7FF] w-[75%] h-[47px] bottom-16 left-1/2 -translate-x-1/2 rounded-full opacity-80" />
          <div className="absolute bg-primary-tertiary md:w-[30%] md:h-[200px] xl:w-[43%] xl:h-[250px] xl:top-[55%] md:top-[50%] -translate-y-1/2 left-1/2 -translate-x-1/2 rounded-t-full shadow-xs" />
        </div>
      </div>
    </div>
  );
};
