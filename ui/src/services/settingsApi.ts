import apiClient from "./apiClient";

export const settingsApi = {
  get: async () => {
    const res = await apiClient.get("/settings/");
    return res.data;
  },
  save: async (data: any) => {
    const res = await apiClient.post("/settings/", data);
    return res.data;
  },
  reindex: async () => {
    const res = await apiClient.post("/settings/reindex");
    return res.data;
  },
  clearRag: async () => {
    const res = await apiClient.delete("/settings/rag");
    return res.data;
  },
  clearSettings: async () => {
    const res = await apiClient.delete("/settings/");
    return res.data;
  },
};
