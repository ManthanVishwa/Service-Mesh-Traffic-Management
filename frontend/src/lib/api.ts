import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface TrafficRule {
  id: string;
  serviceName: string;
  version1Name: string;
  version2Name: string;
  version1Weight: number;
  version2Weight: number;
  ruleType: string;
  createdAt: string;
  updatedAt: string;
  deployedAt: string | null;
  isActive: boolean;
}

export interface CreateTrafficRuleData {
  serviceName: string;
  version1Name: string;
  version2Name: string;
  version1Weight: number;
  version2Weight: number;
  ruleType: "WEIGHTED" | "HEADER_MATCH" | "PATH_BASED";
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const trafficRulesApi = {
  getAll: async (): Promise<TrafficRule[]> => {
    const response = await api.get("/rules");
    return response.data.data;
  },

  getById: async (id: string): Promise<TrafficRule> => {
    const response = await api.get(`/rules/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTrafficRuleData): Promise<TrafficRule> => {
    const response = await api.post("/rules", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: CreateTrafficRuleData
  ): Promise<TrafficRule> => {
    const response = await api.put(`/rules/${id}`, data);
    return response.data.data;
  },

  deploy: async (id: string): Promise<any> => {
    const response = await api.post(`/rules/deploy/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/rules/${id}`);
  },
};
