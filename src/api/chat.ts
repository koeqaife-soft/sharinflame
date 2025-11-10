import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const chatEndpoints = {
  get_user_channels: "/users/me/channels",
  create_channel_and_message: (user_id: string) => `/user/${user_id}/messages`
};

async function getChannels(config: AxiosRequestConfig = {}) {
  return await api.get<
    ApiResponse<{
      channels: UserChannel[];
    }>
  >(chatEndpoints.get_user_channels, config);
}

async function createChannelAndMessage(
  user_id: string,
  content: string,
  file_context_id?: string,
  config: AxiosRequestConfig = {}
) {
  return await api.post<
    ApiResponse<{
      channel: UserChannel;
      message: Message;
    }>
  >(
    chatEndpoints.create_channel_and_message(user_id),
    {
      content: content,
      ...(file_context_id && { file_context_id })
    },
    config
  );
}

function init(_api: AxiosInstance) {
  api = _api;
}
export { init, getChannels, createChannelAndMessage };
