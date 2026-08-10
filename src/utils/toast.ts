import { toast } from "sonner";

export const renderErrorToast = (error: string) => {
  toast.error(error, {
    duration: 7000,
    position: "top-right",
    style: { backgroundColor: "#DC3545", color: "white" },
  });
};

export const renderSuccessToast = (success: string) => {
  toast.success(success, {
    duration: 5000,
    position: "top-right",
    style: { backgroundColor: "#28A745", color: "white" },
  });
};
