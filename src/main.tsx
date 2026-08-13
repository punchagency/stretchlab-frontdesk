import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, Login, Rewards, NotFound, AcceptInvite, ErrorPage, IntakeConversion } from "./pages";
import { AppLayout } from "./components/shared";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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
    path: "/intake-conversion",
    element: (
      <AppLayout>
        <IntakeConversion />
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
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
);
