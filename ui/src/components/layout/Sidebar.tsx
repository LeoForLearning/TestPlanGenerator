import { NavLink, useLocation } from "react-router-dom";
import { useLayout } from "../layout/AppLayout"; 
import {
  HomeIcon,
  Cog6ToothIcon,
  ServerStackIcon,
  DocumentTextIcon,
  FolderArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const { collapsed, setCollapsed } = useLayout();
  const { pathname } = useLocation();

  const menu = [
    { label: "Dashboard", path: "/", icon: HomeIcon },
    { label: "Connections", path: "/connections", icon: ServerStackIcon },
    { label: "Generate Tests", path: "/generate", icon: DocumentTextIcon },
    { label: "Upload Test Suite", path: "/upload", icon: FolderArrowDownIcon },
    { label: "Settings", path: "/settings", icon: Cog6ToothIcon },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen transition-all duration-300 backdrop-blur-md
      ${collapsed ? "w-20" : "w-64"} 
      bg-white/60 border-r border-gray-300`}
      style={{ WebkitBackdropFilter: "blur(14px)" }}
    >
      {/* Branding */}
      <div className="flex items-cente h-16 gap-3 px-4 py-5 border-b border-gray-300">
        <BeakerIcon className="w-7 h-7 text-blue-800" />
        {!collapsed && (
          <h1 className="text-lg font-semibold tracking-wide select-none text-blue-800">
            TestPlanGenerator
          </h1>
        )}
      </div>

      {/* Menu */}
      <nav className="mt-6 flex flex-col gap-1">
        {menu.map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`
              flex items-center gap-3 relative px-4 py-2 mx-3 text-sm rounded-lg transition-all cursor-pointer
              ${isActive ? "font-semibold text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/40"}
              `}
            >
              {/* Active Slim Border Indicator */}
              <span
                className={`
                  absolute left-0 top-0 h-full transition-all
                  ${collapsed ? "w-1" : "w-1"} 
                  ${isActive ? "bg-blue-600 rounded-r-lg" : "bg-transparent"}
                `}
              ></span>

              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-4 w-full px-3 flex flex-col gap-4">

        {/* Support */}
        <button
          className={`flex items-center gap-3 p-2 hover:bg-gray-200/50 rounded-lg transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Support</span>}
        </button>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 p-2 hover:bg-gray-200/50 rounded-lg transition cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Profile */}
        <div
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200/50 cursor-pointer transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <UserCircleIcon className="w-10 h-10 text-gray-600" />
          {!collapsed && (
            <div>
              <p className="font-medium text-sm text-gray-900">Ashish Kumar</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
