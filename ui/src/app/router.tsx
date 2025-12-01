import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

// Lazy-loaded pages
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const ConnectionsPage = lazy(() => import("../pages/ConnectionsPage"));
const GenerateTestsPage = lazy(() => import("../pages/GeneratePage"));
const UploadTestSuitePage = lazy(() => import("../pages/UploadPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "connections", element: <ConnectionsPage /> },
      { path: "generate", element: <GenerateTestsPage /> },
      { path: "upload", element: <UploadTestSuitePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
