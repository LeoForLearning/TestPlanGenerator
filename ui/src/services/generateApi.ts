import apiClient from "./apiClient";

export const generateApi = {
  generate: async (data: { ticketId: string; prompt: string; accuracy: number; top_k?: number }) => {
    const params = data.top_k ? { top_k: data.top_k } : {};
    const res = await apiClient.post("/generate", data, { params });
    return res.data;
  },
};
