import apiClient from "./apiClient";

export const pushApi = {
  pushToAzure: async (testCases: any[], planId?: string, suiteId?: string) => {
    const payload: any = { testCases };
    if (planId) payload.planId = planId;
    if (suiteId) payload.suiteId = suiteId;
    const res = await apiClient.post("/generate/push", payload);
    return res.data;
  },
};
