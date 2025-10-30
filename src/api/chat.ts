import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const chatEndpoints = {
  get_user_channels: "/users/me/channels"
};

async function getChannels(config: AxiosRequestConfig = {}) {
  return await api.get<
    ApiResponse<{
      channels: UserChannel[];
    }>
  >(chatEndpoints.get_user_channels, config);
}

function init(_api: AxiosInstance) {
  api = _api;
}
export { init, getChannels };
