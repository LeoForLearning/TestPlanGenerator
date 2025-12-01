import apiClient from "./apiClient";

export const connectionsApi = {
  saveConnection: async (data: any) => {
    const res = await apiClient.post("/connections/save", data);
    return res.data;
  },

  testConnection: async (data: any) => {
    const res = await apiClient.post("/connections/test", data);
    return res.data;
  },

  getStatus: async () => {
    const res = await apiClient.get("/connections/status");
    return res.data;
  },
};
