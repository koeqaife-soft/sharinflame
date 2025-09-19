import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const moderationEndpoints = {
  create_report: "/reports",
  appellation: (id: string) => `/appellation/${id}`
};

async function createReport(
  reason: string,
  targetId: string,
  targetType: "comment" | "post" | "user" | "message",
  config: AxiosRequestConfig = {}
) {
  return await api.post(
    moderationEndpoints.create_report,
    { reason, target_id: targetId, target_type: targetType },
    config
  );
}

async function sendAppellation(auditId: string, config: AxiosRequestConfig = {}) {
  return await api.post(moderationEndpoints.appellation(auditId), config);
}

function init(_api: AxiosInstance) {
  api = _api;
}

export { createReport, init, sendAppellation };
