import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import JiraIcon from "../assets/icons/jira.svg";
import AzureIcon from "../assets/icons/azure.svg";
import { connectionsApi } from "../services/connectionsApi";

const ConnectionsPage = () => {
  usePageTitle("Connections");

  const [selected, setSelected] = useState<"jira" | "azure">("azure");
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    jira: { url: "", token: "" },
    azure: { org: "", project: "", token: "" },
  }); 

  const currentStatus = useMemo(() => {
    const entry = statusMap[selected];
    return entry?.status || "disconnected";
  }, [selected, statusMap]);

  const currentMessage = useMemo(() => {
    const entry = statusMap[selected];
    return entry?.lastMessage || "";
  }, [selected, statusMap]);

  const handleInput = (tool: "jira" | "azure", key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], [key]: value },
    }));
  };

  const loadStatus = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await connectionsApi.getStatus();
      if (res?.success) {
        setStatusMap(res.data || {});
        setForm((prev) => ({
          jira: {
            url: res.data?.jira?.url || prev.jira.url,
            token: res.data?.jira?.token || "",
          },
          azure: {
            org: res.data?.azure?.org || prev.azure.org,
            project: res.data?.azure?.project || prev.azure.project,
            token: res.data?.azure?.token || "",
          },
        }));
        const keys = Object.keys(res.data || {});
        if (keys.length > 0) {
          const first = keys[0] as "jira" | "azure";
          setSelected(first);
        }
      } else {
        setMessage(res?.message || "Failed to load connection status");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message;
      setMessage(apiMsg ? `Error loading connection status: ${apiMsg}` : "Error loading connection status");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);
    const payload =
      selected === "azure"
        ? { tool: "azure", org: form.azure.org, project: form.azure.project, token: form.azure.token }
        :  { tool: "jira", url: form.jira.url, token: form.jira.token };
    try {
      const res = await connectionsApi.testConnection(payload);
      setMessage(res?.message || "Test completed");
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message;
      setMessage(apiMsg ? `Error testing connection: ${apiMsg}` : "Error testing connection");
    } finally {
      setTesting(false);
    }
  };

  const saveConnection = async () => {
    setSaving(true);
    setMessage(null);
    const payload =
      selected === "jira"
        ? { tool: "jira", url: form.jira.url, token: form.jira.token }
        : { tool: "azure", org: form.azure.org, project: form.azure.project, token: form.azure.token };
    try {
      const res = await connectionsApi.saveConnection(payload);
      if (res?.success) {
        setMessage(res?.message || "Connection saved");
        setStatusMap((prev) => ({
          ...prev,
          [selected]: res.data,
        }));
      } else {
        setMessage(res?.message || "Failed to save connection");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message;
      setMessage(apiMsg ? `Error saving connection: ${apiMsg}` : "Error saving connection");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🔌 Connect Your Workspace</h1>
        <p className="text-gray-500 text-sm">
          Authenticate your Jira or Azure DevOps workspace to fetch tickets and generate structured test cases automatically.
        </p>
      </div>

      {/* Tool Selector */}
      <div className="flex gap-4 bg-white/60 backdrop-blur-lg p-3 rounded-xl border shadow-sm w-fit">
       <button
          onClick={() => setSelected("azure")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition border 
          ${
            selected === "azure"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent hover:border-gray-300 hover:bg-gray-100"
          }`}
        >
          <img src={AzureIcon} className="w-5 h-5" />
          Azure DevOps
        </button>
        
        <button
          onClick={() => setSelected("jira")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition border 
          ${
            selected === "jira"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent hover:border-gray-300 hover:bg-gray-100"
          }`}
        >
          <img src={JiraIcon} className="w-5 h-5" />
          Jira
        </button>
      </div>

      {message && (
        <div
          className={`text-sm rounded-md px-3 py-2 border ${
            message.toLowerCase().includes("error")
              ? "text-red-700 bg-red-50 border-red-200"
              : "text-blue-700 bg-blue-50 border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form className="bg-white/60 backdrop-blur-lg p-6 rounded-xl border shadow-sm space-y-5">
        {selected === "jira" && (
          <>
            <Input
              label="Jira Base URL"
              placeholder="https://yourcompany.atlassian.net"
              value={form.jira.url}
              onChange={(v) => handleInput("jira", "url", v)}
              disabled={loading}
            />
            <Input
              label="API Token"
              type="password"
              placeholder="Enter your Jira API token"
              value={form.jira.token}
              onChange={(v) => handleInput("jira", "token", v)}
              disabled={loading}
            />
          </>
        )}

        {selected === "azure" && (
          <>
            <Input
              label="Organization Name"
              placeholder="ex: microsoft-devops"
              value={form.azure.org}
              onChange={(v) => handleInput("azure", "org", v)}
              disabled={loading}
            />
            <Input
              label="Project Name"
              placeholder="ex: core-platform"
              value={form.azure.project}
              onChange={(v) => handleInput("azure", "project", v)}
              disabled={loading}
            />
            <Input
              label="Personal Access Token (PAT)"
              type="password"
              placeholder="Enter Azure PAT token"
              value={form.azure.token}
              onChange={(v) => handleInput("azure", "token", v)}
              disabled={loading}
            />
          </>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          {/* Status Badge */}
          <StatusIndicator status={currentStatus} message={currentMessage} />

          {/* Button Group */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || loading}
              className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>

            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                saveConnection();
              }}
              disabled={saving || loading}
              className="px-5 py-2 text-sm border border-gray-400 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & Activate"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConnectionsPage;

// ------------------ Components ------------------

const Input = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
    />
  </div>
);

const StatusIndicator = ({ status, message }: { status: string; message?: string }) => {
  const styles: Record<string, string> = {
    connected: "text-green-600 bg-green-100 border-green-300",
    disconnected: "text-red-600 bg-red-100 border-red-300",
    testing: "text-yellow-600 bg-yellow-100 border-yellow-300",
  };

  const label =
    status === "connected" ? "Connected" : status === "testing" ? "Testing..." : "Not Connected";

  return (
    <div className={`text-sm border px-3 py-1 rounded-lg ${styles[status] || styles.disconnected}`}>
      {label}
      {message ? <span className="ml-2 text-xs text-gray-600">{message}</span> : null}
    </div>
  );
};
