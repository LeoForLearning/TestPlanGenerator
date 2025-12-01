import { createContext, useContext, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom"; 

// -------------------- CONTEXT TYPE --------------------
interface LayoutContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// Provide proper type instead of null
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used inside AppLayout");
  }
  return context;
};

// -------------------- MAIN LAYOUT --------------------
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>
      <Sidebar />
      <Header />
      <main
        className={`
          pt-20 px-10 pb-10 bg-gray-50 min-h-screen transition-all duration-300
          ${collapsed ? "ml-20" : "ml-64"}
        `}
      >
        <Outlet />
      </main>
    </LayoutContext.Provider>
  );
};

export default AppLayout;
