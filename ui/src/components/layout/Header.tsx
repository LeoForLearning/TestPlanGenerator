import { useLayout } from "../layout/AppLayout"; // adjust path if needed
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import JiraIcon from "../../assets/icons/jira.svg";
import AzureIcon from "../../assets/icons/azure.svg";

const Header = () => {
  const { collapsed } = useLayout();

  // Mock connection (will be dynamic later)
  const connected = true;
  const tool = "azure"; // or "Azure DevOps"

  const getToolLogo = () => {
    if (tool.toLowerCase().includes("jira")) return JiraIcon;
    if (tool.toLowerCase().includes("azure")) return AzureIcon;
    return null;
  };

  const toolLogo = getToolLogo();

  return (
    <header
      className={`
        fixed top-0 right-0 h-14 bg-white/60 backdrop-blur-lg shadow-sm
        flex items-center justify-between px-6 transition-all duration-300 ease-in-out
        ${collapsed ? "ml-20 w-[calc(100%-80px)]" : "ml-64 w-[calc(100%-256px)]"}
      `}
    >
      {/* Left Placeholder (Future Search Bar etc.) */}
      <span className="text-gray-600 font-semibold text-sm tracking-wide">
        Test Plan Generator
      </span>

      {/* Connection Status on Right */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-800 hover:bg-gray-100 transition"
          aria-label="Refresh connection"
          onClick={() => {
            // TODO: wire to real refresh action
            console.log("Refresh connection clicked");
          }}
        >
          <ArrowPathIcon className="w-4 h-4 text-gray-700" />
          <span className="font-medium">Refresh Connection</span>
        </button>

        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition cursor-pointer
          hover:bg-gray-200/40`}
        >
          {toolLogo && <img src={toolLogo} alt={tool} className="w-5 h-5 opacity-90" />}

          {connected ? (
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="font-medium">Connected • {tool}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircleIcon className="w-4 h-4 text-red-600" />
              <span className="font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;