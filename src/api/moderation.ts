import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const moderationEndpoints = {
  create_report: "/reports",
  appellation: (id: string) => `/appellation/${id}`,
  assigned_resource: "/moderation/assigned_resource",
  dismiss_assigned: (id: string) => `/moderation/assigned_resource/${id}/dismiss`
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

async function getAssignedResource(config: AxiosRequestConfig = {}) {
  return await api.get(moderationEndpoints.assigned_resource, config);
}

async function dismissAssigned(id: string, config: AxiosRequestConfig = {}) {
  return await api.post(moderationEndpoints.dismiss_assigned(id), config);
}

function init(_api: AxiosInstance) {
  api = _api;
}

export { createReport, init, sendAppellation, getAssignedResource, dismissAssigned };
