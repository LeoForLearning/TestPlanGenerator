import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  CloudArrowDownIcon,
  ArrowUpRightIcon,
  ServerStackIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { generateApi } from "../services/generateApi";
import { pushApi } from "../services/pushApi";

type TabKey = "steps" | "bdd" | "boundary" | "raw";

type TestCase = {
  id: number;
  title: string;
  steps: string[];
  expected: string;
  bdd?: string;
  boundaryCases?: string[];
};

const GeneratePage = () => {
  usePageTitle("Generate Tests");

  const [selectedTicket, setSelectedTicket] = useState("");
  const [prompt, setPrompt] = useState(
    "Generate detailed manual test cases including title, steps, and expected result. Use clear step-by-step instructions."
  );
  const [accuracy, setAccuracy] = useState(85);
  const [tab, setTab] = useState<TabKey>("steps");

  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushDone, setPushDone] = useState(false);
  const [fullView, setFullView] = useState(false);

  const connectionTool = "Azure DevOps"; // later this can come from real connection state

  const handleGenerate = async () => {
    if (!selectedTicket || !prompt) {
      setStatusMessage("Ticket number and prompt are required.");
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    setTestCases(null);
    setRawOutput(null);
    setNote(null);
    setSaved(false);
    setPushDone(false);

    const top_k = Math.max(1, Math.min(10, Math.round(accuracy / 10))); // simple mapping

    try {
      const res = await generateApi.generate({ ticketId: selectedTicket, prompt, accuracy, top_k });
      if (res?.success) {
        const tc = (res.data?.testCases || []).map((t: any, idx: number) => ({
          id: idx + 1,
          title: t.title || `Test Case ${idx + 1}`,
          steps: t.steps || [],
          expected: t.expected || "",
          bdd: t.bdd,
          boundaryCases: t.boundaryCases || [],
        }));
        setTestCases(tc.length ? tc : null);
        setRawOutput(
          tc
            .map(
              (t: { title: any; steps: any[]; expected: any; }, i: number) =>
                `${i + 1}. ${t.title}\nSteps:\n- ${t.steps.join("\n- ")}\nExpected: ${t.expected}\n`
            )
            .join("\n")
        );
        setNote(res.data?.note || null);
        setStatusMessage(res.message || "Generated successfully.");
      } else {
        setStatusMessage(res?.message || "Generation failed.");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.detail || err?.message;
      setStatusMessage(apiMsg ? `Generation error: ${apiMsg}` : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!rawOutput) return;
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // ---------- EXPORT HELPERS ----------

  const downloadBlob = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!testCases) return;
    downloadBlob(JSON.stringify(testCases, null, 2), "testcases.json", "application/json");
  };

  const handleExportCSV = () => {
    if (!testCases) return;
    const header = ["id", "title", "steps", "expected"].join(",");
    const rows = testCases.map((t) =>
      [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.steps.join(" | ").replace(/"/g, '""')}"`,
        `"${t.expected.replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    downloadBlob(csv, "testcases.csv", "text/csv");
  };

  const handleExportXLSX = () => {
    // Recommended: implement via backend or add SheetJS later.
    alert("XLSX export: call backend export API here (e.g. /export/xlsx).");
  };

  const handleExportPDF = () => {
    // Recommended: implement via backend or server-side PDF generation.
    alert("PDF export: call backend export API here (e.g. /export/pdf).");
  };

  // ---------- SAVE / PUSH STUBS ----------

  const handleAddToRAG = async () => {
    // TODO: implement API to persist generated cases into RAG if needed
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 800);
  };

  const handlePushToTool = async () => {
    if (!testCases) return;
    setPushing(true);
    setPushDone(false);
    try {
      const res = await pushApi.pushToAzure(testCases);
      if (res?.success) {
        setStatusMessage(res.message || "Pushed to Azure DevOps.");
        setPushDone(true);
      } else {
        setStatusMessage(res?.message || "Failed to push to Azure DevOps.");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.detail || err?.message;
      setStatusMessage(apiMsg ? `Push error: ${apiMsg}` : "Push failed.");
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ---------- LEFT: INPUT / CONTROLS ---------- */}
      <section className="bg-white/60 backdrop-blur-lg border rounded-xl shadow-md p-6 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">🧩 Test Case Generator</h2>
          <p className="text-gray-500 text-sm">
            Use your ticket context + AI prompt to generate structured, high quality test cases.
          </p>
        </div>

        {/* Ticket */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Ticket Number</label>
          <input
            placeholder="e.g. JIRA-231 or ADO-110"
            value={selectedTicket}
            onChange={(e) => setSelectedTicket(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-400">
            This will be used to fetch context from Jira / Azure (description, acceptance criteria, comments).
          </p>
        </div>

        {/* Prompt */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Custom Prompt</label>
          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-400">
            Edit this prompt to control level of detail, edge cases, or specific formats (BDD, negative cases, etc.).
          </p>
        </div>

        {/* Accuracy Slider */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex justify-between">
            Accuracy Target <span className="font-semibold">{accuracy}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={100}
            value={accuracy}
            onChange={(e) => setAccuracy(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-gray-400 text-xs">
            Higher accuracy uses more context and stricter formatting rules. You can fine-tune later in settings.
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Test Cases"}
        </button>
      </section>

      {/* ---------- RIGHT: OUTPUT / ACTIONS ---------- */}
      <section className="relative bg-white/60 backdrop-blur-lg border rounded-xl shadow-md p-6 space-y-4 h-fit">
        {/* Header row: title + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">📄 Generated Test Cases</h2>
            <p className="text-xs text-gray-500">
              View different representations, export, save to DB, or push back to {connectionTool}.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setFullView(true)}
              className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs hover:bg-gray-100"
              aria-label="Full view"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            {/* Export dropdown-like buttons */}
            <button
              onClick={handleExportJSON}
              disabled={!testCases}
              className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              <CloudArrowDownIcon className="w-4 h-4" /> JSON
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!testCases}
              className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              <CloudArrowDownIcon className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={handleExportXLSX}
              disabled={!testCases}
              className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              <CloudArrowDownIcon className="w-4 h-4" /> XLSX
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!testCases}
              className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              <CloudArrowDownIcon className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-4 text-sm">
          {[
            { key: "steps", label: "Steps View" },
            { key: "bdd", label: "BDD Format" },
            { key: "boundary", label: "Boundary Cases" },
            { key: "raw", label: "Raw Text" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={`pb-2 border-b-2 -mb-px transition ${
                tab === t.key
                  ? "border-blue-600 text-blue-700 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Output View */}
        <div className="border rounded-lg p-4 bg-white h-[350px] overflow-auto text-sm text-gray-800">
          {statusMessage && (
            <p className="text-xs mb-2 text-gray-600">{statusMessage}</p>
          )}
          {note && (
            <p className="text-xs mb-2 text-gray-500">
              <span className="font-medium">Note:</span> {note}
            </p>
          )}
          {!testCases && !rawOutput && <p className="text-gray-400">No test cases generated yet...</p>}

          {testCases && tab === "steps" && (
            <div className="space-y-4">
              {testCases.map((t) => (
                <div key={t.id} className="border-b pb-3 last:border-none">
                  <p className="font-semibold mb-1">{t.title}</p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    {t.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <p className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Expected:</span> {t.expected}
                  </p>
                </div>
              ))}
            </div>
          )}

          {testCases && tab === "bdd" && (
            <div className="space-y-4 font-mono text-xs">
              {testCases.map((t) => (
                <div key={t.id} className="border-b pb-3 last:border-none">
                  <p className="font-semibold mb-1 text-gray-800">{t.title}</p>
                  <pre className="whitespace-pre-wrap text-gray-700">{t.bdd}</pre>
                </div>
              ))}
            </div>
          )}

          {testCases && tab === "boundary" && (
            <div className="space-y-4">
              {testCases.map((t) => (
                <div key={t.id} className="border-b pb-3 last:border-none">
                  <p className="font-semibold mb-1 text-gray-800">{t.title}</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {t?.boundaryCases && t?.boundaryCases.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {rawOutput && tab === "raw" && (
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{rawOutput}</pre>
          )}
        </div>

        {/* Bottom Actions: Copy / Regenerate / Save / Push */}
        <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!rawOutput}
              className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              disabled={!testCases}
              onClick={handleGenerate}
              className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ArrowPathIcon className="w-4 h-4" /> Re-Generate
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddToRAG}
              disabled={!testCases || saving}
              className={`text-xs flex items-center gap-2 px-3 py-1 rounded-lg border 
  ${saved ? "bg-green-100 border-green-400 text-green-700" : "hover:bg-gray-100"} 
  disabled:opacity-40 transition`}
            >
              {saved ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ServerStackIcon className="w-4 h-4" />
              )}

              {saving
                ? "Indexing..."
                : saved
                ? "Added to Knowledge Base"
                : "Add to RAG"}
            </button>

            <button
              onClick={handlePushToTool}
              disabled={!testCases || pushing}
              className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-40"
            >
              <ArrowUpRightIcon className="w-4 h-4" />
              {pushing ? `Pushing to ${connectionTool}...` : pushDone ? `Pushed to ${connectionTool}` : `Push to ${connectionTool}`}
            </button>
          </div>
        </div>
      </section>

      {/* Full screen overlay for Generated Test Cases */}
      {fullView && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setFullView(false)} />
          <div className="fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">📄 Generated Test Cases (Full View)</h2>
                <p className="text-xs text-gray-500">
                  View, copy, export, or push your generated cases with more space.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullView(false)}
                className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {/* Reuse the same tabbed view by rendering the existing section body */}
              <div className="border-b flex gap-4 text-sm">
                {[
                  { key: "steps", label: "Steps View" },
                  { key: "bdd", label: "BDD Format" },
                  { key: "boundary", label: "Boundary Cases" },
                  { key: "raw", label: "Raw Text" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as TabKey)}
                    className={`pb-2 border-b-2 -mb-px transition ${
                      tab === t.key
                        ? "border-blue-600 text-blue-700 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-white h-[65vh] overflow-auto text-sm text-gray-800">
                {!testCases && !rawOutput && (
                  <p className="text-gray-400">No test cases generated yet...</p>
                )}

                {testCases && tab === "steps" && (
                  <div className="space-y-4">
                    {testCases.map((t) => (
                      <div key={t.id} className="border-b pb-3 last:border-none">
                        <p className="font-semibold mb-1">{t.title}</p>
                        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                          {t.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                        <p className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Expected:</span> {t.expected}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {testCases && tab === "bdd" && (
                  <div className="space-y-4 font-mono text-xs">
                    {testCases.map((t) => (
                      <div key={t.id} className="border-b pb-3 last:border-none">
                        <p className="font-semibold mb-1 text-gray-800">{t.title}</p>
                        <pre className="whitespace-pre-wrap text-gray-700">{t.bdd}</pre>
                      </div>
                    ))}
                  </div>
                )}

                {testCases && tab === "boundary" && (
                  <div className="space-y-4">
                    {testCases.map((t) => (
                      <div key={t.id} className="border-b pb-3 last:border-none">
                        <p className="font-semibold mb-1 text-gray-800">{t.title}</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {t?.boundaryCases && t.boundaryCases.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {rawOutput && tab === "raw" && (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{rawOutput}</pre>
                )}
              </div>
            </div>

            {/* Full view footer actions */}
            <div className="flex flex-wrap gap-3 justify-between items-center pt-4">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!rawOutput}
                  className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  disabled={!testCases}
                  onClick={handleGenerate}
                  className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  <ArrowPathIcon className="w-4 h-4" /> Re-Generate
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddToRAG}
                  disabled={!testCases || saving}
                  className={`text-xs flex items-center gap-2 px-3 py-1 rounded-lg border 
  ${saved ? "bg-green-100 border-green-400 text-green-700" : "hover:bg-gray-100"} 
  disabled:opacity-40 transition`}
                >
                  {saved ? (
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <ServerStackIcon className="w-4 h-4" />
                  )}

                  {saving
                    ? "Indexing..."
                    : saved
                    ? "Added to Knowledge Base"
                    : "Add to RAG"}
                </button>

                <button
                  onClick={handlePushToTool}
                  disabled={!testCases || pushing}
                  className="text-xs flex items-center gap-2 px-3 py-1 border rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-40"
                >
                  <ArrowUpRightIcon className="w-4 h-4" />
                  {pushing ? `Pushing to ${connectionTool}...` : pushDone ? `Pushed to ${connectionTool}` : `Push to ${connectionTool}`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GeneratePage;
