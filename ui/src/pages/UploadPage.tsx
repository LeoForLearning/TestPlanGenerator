import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { CloudArrowUpIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { uploadApi } from "../services/uploadApi";

type PreviewRow = {
  id: number;
  title: string;
  steps: string;
  expected: string;
};

type UploadHistory = {
  filename: string;
  uploadedAt?: string;
  status?: string;
  indexed?: boolean;
  indexMessage?: string;
  storedName?: string;
  contentType?: string;
  size?: number;
};

const UploadPage = () => {
  usePageTitle("Upload Test Suites");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedExtensions = ["xlsx", "xls", "csv"];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      alert("Only XLSX, XLS, or CSV formats are allowed.");
      return;
    }

    setFile(selectedFile);
    // TODO: Replace with real preview parsing logic
    setPreview([
      { id: 1, title: "Login validity", steps: "Enter user + password", expected: "Login success" },
      { id: 2, title: "Invalid password", steps: "Wrong password attempt", expected: "Error message appears" },
    ]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setIndexed(false);
    setMessage(null);

    try {
      const res = await uploadApi.upload(file);
      if (res?.success) {
        setIndexed(!!res.data?.indexed);
        setMessage(res.message || "Uploaded");
        // Clear selection and preview after a successful upload
        setFile(null);
        setPreview([]);
        await loadHistory();
      } else {
        setMessage(res?.message || "Upload failed");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message;
      setMessage(apiMsg ? `Upload error: ${apiMsg}` : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setIndexed(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await uploadApi.history();
      if (res?.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a, b) => {
          const da = new Date(a.uploadedAt || "").getTime();
          const db = new Date(b.uploadedAt || "").getTime();
          return db - da;
        });
        setHistory(sorted);
      }
    } catch (err) {
      // ignore for now
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📁 Upload Test Suites</h1>
        <p className="text-gray-500 text-sm">
          Upload existing test cases (Excel or CSV). These will be used to improve the model’s contextual accuracy for future generation.
        </p>
      </div>

      {message && (
        <div
          className={`text-center text-sm rounded-md px-3 py-2 border ${
            message.toLowerCase().includes("error")
              ? "text-red-700 bg-red-50 border-red-200"
              : "text-blue-700 bg-blue-50 border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Upload Box */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-white/60 backdrop-blur-sm hover:border-blue-500 transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {!file ? (
          <>
            <CloudArrowUpIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">
              Accepted: .xlsx • .xls • .csv
            </p>
          </>
        ) : (
          <>
            <CheckIcon className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700">{file.name}</p>
            <p className="text-xs text-gray-500">File ready for processing</p>
          </>
        )}

        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="bg-white/60 backdrop-blur-lg border rounded-xl shadow-md p-6 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-black underline"
            >
              Remove file
            </button>
          </div>

          <table className="w-full text-sm border-collapse border">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Steps</th>
                <th className="p-2 border">Expected</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border text-center">{i + 1}</td>
                  <td className="p-2 border">{row.title}</td>
                  <td className="p-2 border">{row.steps}</td>
                  <td className="p-2 border">{row.expected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading || indexed}
          className={`w-full px-5 py-3 rounded-lg text-sm font-medium transition ${
            indexed
              ? "bg-green-100 text-green-700 border border-green-400"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {uploading
            ? "Indexing into RAG..."
            : indexed
            ? "✔ Added to Knowledge Base"
            : "Process & Add to RAG"}
        </button>
      )}

      {/* Info */}
      {indexed && (
        <p className="text-green-600 text-sm text-center">
          This file is now part of the RAG knowledge base and will be used to improve future generated test cases.
        </p>
      )}

      {/* Upload History */}
      <div className="bg-white/60 backdrop-blur-lg border rounded-xl shadow-md p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Upload History</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Showing {history.length} entr{history.length === 1 ? "y" : "ies"}
            </span>
            <button
              onClick={loadHistory}
              className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1 disabled:opacity-50"
              disabled={historyLoading}
            >
              <ArrowPathIcon className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
        <table className="w-full text-sm border-collapse border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 border">File Name</th>
              <th className="p-2 border">Size</th>
              <th className="p-2 border">Uploaded At</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.storedName || item.filename} className="hover:bg-gray-50">
                <td className="p-2 border">{item.filename}</td>
                <td className="p-2 border">{item.size ? `${(item.size / 1024).toFixed(1)} KB` : "—"}</td>
                <td className="p-2 border">{item.uploadedAt}</td>
                <td className="p-2 border">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      item.status?.toLowerCase() === "indexed" || item.indexed
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : item.status?.toLowerCase() === "failed"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    {item.status || (item.indexed ? "Indexed" : "Pending")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UploadPage;
