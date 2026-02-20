import apiClient from "./apiClient";

export const uploadApi = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post("/upload/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  history: async () => {
    const res = await apiClient.get("/upload/history");
    return res.data;
  },
};
