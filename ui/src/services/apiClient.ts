// src/services/apiClient.ts
import axios from "axios";

const rawBase = (import.meta.env.VITE_API_URL as string | undefined) || "http://127.0.0.1:8000";
// Normalize: strip any trailing path like /api or /api/connections, then append a single /api.
let baseURL = rawBase.replace(/\/+$/, "");
baseURL = baseURL.replace(/\/api.*$/i, "");
baseURL = `${baseURL}/api`;

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Optional: Interceptors (for logging, auth, etc.)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API ERROR]", error.response || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
