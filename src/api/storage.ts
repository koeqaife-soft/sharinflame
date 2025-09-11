import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

let api: AxiosInstance;

export const storageEndpoints = {
  upload: "/storage/file",
  context: "/storage/context"
};

export interface StorageConfigEntry {
  maxSize: number;
  maxCount: number;
  allowedTypes: string[];
}

export const storageConfig: Record<CreateContextType, StorageConfigEntry> = {
  post_video: {
    maxSize: 15,
    maxCount: 1,
    allowedTypes: ["video/mp4", "video/webm"]
  },
  post_image: {
    maxSize: 10,
    maxCount: 5,
    allowedTypes: ["image/webp", "image/png", "image/jpeg", "image/gif"]
  }
};

async function uploadFile(
  filename: string,
  blob: Blob,
  type: "avatar" | "banner" | "context",
  config?: AxiosRequestConfig,
  contextId?: string
) {
  const r = await api.post<
    ApiResponse<{
      file_url: string;
      headers: Record<string, string>;
      file_name: string;
      context_id: string;
    }>
  >(
    storageEndpoints.upload,
    {
      file_name: filename,
      type: type,
      ...(contextId && { context_id: contextId })
    },
    config
  );

  if (!r.data.success) {
    throw new Error(r.data.error ?? "Couldn't upload file");
  }

  const { file_url, headers } = r.data.data;

  await axios.put(file_url, blob, {
    headers: {
      ...headers,
      "Content-Type": blob.type
    }
  });

  return r;
}

async function createContext(type: CreateContextType, config?: AxiosRequestConfig) {
  const r = await api.post<
    ApiResponse<{
      context_id: string;
      max_size: number;
      max_count: number;
      expires: number;
    }>
  >(storageEndpoints.context, { type: type }, config);
  return r;
}

function init(_api: AxiosInstance) {
  api = _api;
}

export { init, uploadFile, createContext };
