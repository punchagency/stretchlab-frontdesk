import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, Login, Rewards, NotFound, AcceptInvite, ErrorPage, ReviewInbox, GoalsPage, ReviewsPage } from "./pages";
import { AppLayout } from "./components/shared";
import { useVersionCheck } from "./hooks/useVersionCheck";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Wrapper to run the version check hook at root level
const VersionGuard = ({ children }: { children: React.ReactNode }) => {
  useVersionCheck();
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <Home />
      </AppLayout>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/goals",
    element: (
      <AppLayout>
        <GoalsPage />
      </AppLayout>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/reviews",
    element: (
      <AppLayout>
        <ReviewsPage />
      </AppLayout>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/intake-conversion",
    element: <Navigate to="/?tab=performance" replace />,
  },
  {
    path: "/review-inbox",
    element: (
      <AppLayout>
        <ReviewInbox />
      </AppLayout>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/rewards",
    element: (
      <AppLayout>
        <Rewards />
      </AppLayout>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/invitation",
    element: <AcceptInvite />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <VersionGuard>
        <RouterProvider router={router} />
        <Toaster />
      </VersionGuard>
    </QueryClientProvider>
  </StrictMode>
);
