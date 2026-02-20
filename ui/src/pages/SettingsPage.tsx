import { useEffect, useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { settingsApi } from "../services/settingsApi";

type Settings = {
  collectionName: string;
  model: string;
  apiKey: string;
  temperature: number;
  autoStoreVerified: boolean;
  embedProvider: string;
  embedModel: string;
  embedBaseUrl: string;
};

const defaultSettings: Settings = {
  model: "llama3",
  apiKey: "",
  temperature: 0.4,
  autoStoreVerified: true,
  embedProvider: "sentence_transformer",
  embedModel: "all-MiniLM-L6-v2",
  embedBaseUrl: "http://localhost:11434",
  collectionName: ""
};

const llmOptions = [
  { value: "llama3", label: "Ollama: llama3" },
  { value: "gpt-4o", label: "OpenAI: GPT-4o" },
  { value: "gpt-4.1", label: "OpenAI: GPT-4.1" },
  { value: "gpt-4.1-mini", label: "OpenAI: GPT-4.1-mini" },
  { value: "gpt-4o-mini", label: "OpenAI: GPT-4o-mini" },
  { value: "gpt-3.5-turbo", label: "OpenAI: GPT-3.5 Turbo" },
  { value: "claude-3-5", label: "Anthropic: Claude 3.5" },
  { value: "azure", label: "Azure OpenAI" },
];

const embedProviderOptions = [
  { value: "sentence_transformer", label: "SentenceTransformer" },
  { value: "ollama", label: "Ollama" },
  { value: "hash", label: "Hash (fast, offline)" },
];

const embedModelOptions = {
  sentence_transformer: [
    { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2" },
    { value: "e5-small-v2", label: "e5-small-v2" },
    { value: "e5-base-v2", label: "e5-base-v2" },
    { value: "bge-small-en-v1.5", label: "bge-small-en-v1.5" },
    { value: "bge-base-en-v1.5", label: "bge-base-en-v1.5" },
    { value: "text-embedding-3-small", label: "OpenAI: text-embedding-3-small" },
    { value: "text-embedding-3-large", label: "OpenAI: text-embedding-3-large" },
    { value: "text-embedding-ada-002", label: "OpenAI: text-embedding-ada-002" },
  ],
  ollama: [
    { value: "nomic-embed-text", label: "nomic-embed-text" },
    { value: "mxbai-embed-large", label: "mxbai-embed-large" },
    { value: "all-minilm", label: "all-minilm (Ollama)" },
  ],
  hash: [{ value: "hash-placeholder", label: "Hash placeholder" }],
} as const;

const SettingsPage = () => {
  usePageTitle("Settings");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: keyof Settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await settingsApi.get();
      if (data?.success && data?.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
        setDirty(false);
      } else {
        setMessage("Failed to load settings");
      }
    } catch (err) {
      setMessage("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = await settingsApi.save(settings);
      if (data?.success) {
        setMessage("Settings saved");
        setDirty(false);
      } else {
        setMessage(data?.message || "Failed to save settings");
      }
    } catch (err) {
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const reindex = async () => {
    setReindexing(true);
    setMessage(null);
    try {
      const data = await settingsApi.reindex();
      setMessage(data?.message || "Reindex triggered");
      setDirty(false);
    } catch (err) {
      setMessage("Error triggering reindex");
    } finally {
      setReindexing(false);
    }
  };

  const clearRag = async () => {
    setMessage(null);
    try {
      const data = await settingsApi.clearRag();
      setMessage(data?.message || "RAG data cleared");
    } catch (err) {
      setMessage("Error clearing RAG data");
    }
  };

  const clearSettings = async () => {
    setMessage(null);
    try {
      const data = await settingsApi.clearSettings();
      setSettings(defaultSettings);
      setMessage(data?.message || "Settings cleared");
    } catch (err) {
      setMessage("Error clearing settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const tempValue = Number(settings.temperature || 0).toFixed(2);

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">⚙ Settings</h1>

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

      {/* AI Config */}
      <section className="bg-white/60 backdrop-blur-md border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Generation</h2>
          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Model</label>
          <select
            className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
            value={settings.model}
            onChange={(e) => handleChange("model", e.target.value)}
            disabled={loading}
          >
            {llmOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <label>API Key / Token</label>
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <input
            type={showKey ? "text" : "password"}
            placeholder="Paste key"
            value={settings.apiKey}
            onChange={(e) => handleChange("apiKey", e.target.value)}
            className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            For OpenAI/Azure, add your API key here. Recommend storing keys server-side; client entry is persisted to the JSON store for this POC.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium flex justify-between">
            Temperature{" "}
            <span className="text-xs text-gray-600">
              {tempValue} (Controls randomness; lower = deterministic, higher = creative)
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            className="w-full"
            value={settings.temperature}
            onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Adjusts variability in generation. Use low values for consistent outputs; higher for more varied ideas.
          </p>
        </div>

      </section>

      {/* RAG */}
      <section className="bg-white/60 backdrop-blur-md border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">RAG & Knowledge Base</h2>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoStoreVerified}
            onChange={(e) => handleChange("autoStoreVerified", e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm">Automatically store verified test cases</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Embedding Provider</label>
            <select
              className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
              value={settings.embedProvider}
              onChange={(e) => handleChange("embedProvider", e.target.value)}
              disabled={loading}
            >
              {embedProviderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Embedding Model</label>
            <select
              className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
              value={settings.embedModel}
              onChange={(e) => handleChange("embedModel", e.target.value)}
              disabled={loading}
            >
              {(embedModelOptions as any)[settings.embedProvider]?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )) || <option value={settings.embedModel}>{settings.embedModel}</option>}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Embedding Base URL (for Ollama)</label>
            <input
              className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
              value={settings.embedBaseUrl}
              onChange={(e) => handleChange("embedBaseUrl", e.target.value)}
              placeholder="http://localhost:11434"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Chroma Collection Name ( Optional )</label>
            <input
              className="mt-1 border rounded-lg px-3 py-2 w-full text-sm"
              value={settings?.collectionName || ""}
              onChange={(e) => handleChange("collectionName", e.target.value)}
              placeholder="rag_uploads"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50 bg-yellow-50 border-yellow-300 text-yellow-800"
            onClick={reindex}
            disabled={reindexing || loading}
          >
            {reindexing ? "Re-indexing..." : dirty ? "Re-index Now" : "Re-index Now"}
          </button>
          <button
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-800"
            onClick={clearSettings}
            disabled={loading}
          >
            Clear Settings
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 border border-red-300 rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <button
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          onClick={clearRag}
          disabled={loading}
        >
          Delete All RAG Data
        </button>
      </section>
    </div>
  );
};

export default SettingsPage;
