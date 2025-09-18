import { isAxiosError } from "axios";
import type { AxiosError, AxiosResponse, AxiosInstance } from "axios";
import type { useMainStore } from "src/stores/main-store";
import { watch } from "vue";
import router from "src/router";
import { refresh, getAccessToken, noAuthEndpoints, refreshToken } from "src/api/auth";

let api: AxiosInstance;
type mainStoreType = ReturnType<typeof useMainStore>;
let mainStore: mainStoreType;

function is5xxError(error: AxiosError) {
  const response = error.response;
  return response && response.status >= 500 && response.status < 600;
}

const connectionInterceptor = () => {
  const isConnectionError = (e: AxiosError) => {
    if (e.code === "ERR_CANCELED") {
      return false;
    }
    if (!e.response || e.code === "ECONNABORTED") {
      return true;
    }
    return e.response.status === 502;
  };

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      mainStore.setIsOffline(false);
      return response;
    },
    async (error: AxiosError<unknown>) => {
      const config = error.config as typeof error.config & { __retry: boolean };

      if (config.__retry) return Promise.reject(error);
      config.__retry = true;

      if (is5xxError(error)) {
        return Promise.reject(error);
      }

      if (isConnectionError(error)) {
        mainStore.setIsOffline(true);
        if (!config.url?.includes("/ping"))
          return new Promise((resolve, reject) => {
            const watching = watch(
              () => mainStore.isOffline,
              async (newValue) => {
                if (!newValue) {
                  let retryResponse: AxiosResponse<unknown, unknown> | undefined = undefined;
                  try {
                    retryResponse = await api(config);
                    resolve(retryResponse);
                    watching.stop();
                  } catch (e) {
                    if (isAxiosError(e) && isConnectionError(e)) {
                      mainStore.setIsOffline(true);
                    } else {
                      watching.stop();
                      reject(e as Error);
                    }
                  }
                }
              },
              { immediate: true }
            );
          });
      } else {
        mainStore.setIsOffline(false);
      }

      return Promise.reject(error);
    }
  );
};
const refreshChannel = new BroadcastChannel("refresh_token_channel");

let isRefreshing = false;
let subscribers: Array<(success: boolean) => void> = [];
let lastRefresh: number = 0;

const invalidAuth = () => {
  clearRefreshSubscribers();
  if (mainStore.initialized == 2) window.location.reload();
  mainStore.initialized = 1;
  void router.push({ path: "/login" });
};

const onRefreshed = (success: boolean) => {
  lastRefresh = Date.now();
  subscribers.forEach((callback) => callback(true));
  subscribers = [];
  isRefreshing = false;
  refreshChannel.postMessage({ type: "refresh_complete", success });
};

const clearRefreshSubscribers = () => {
  subscribers.forEach((callback) => callback(false));
  subscribers = [];
};

const addRefreshSubscriber = (callback: (success: boolean) => void) => {
  if (Date.now() - lastRefresh <= 15000) {
    setTimeout(() => callback(true), 100);
    return;
  }
  subscribers.push(callback);
};

refreshChannel.onmessage = (event) => {
  if (event.data.type === "refresh_start") {
    isRefreshing = true;
  } else if (event.data.type === "refresh_complete") {
    isRefreshing = false;
    lastRefresh = Date.now();
    subscribers.forEach((callback) => callback(event.data.success));
    subscribers = [];
  }
};

const authInterceptor = () => {
  api.interceptors.request.use(
    async (config) => {
      if (!config.url || noAuthEndpoints.includes(config.url)) return config;
      await waitForRefresh();

      let token = getAccessToken();
      const _refreshToken = refreshToken();

      if (!token && _refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshChannel.postMessage({ type: "refresh_start" });
          let success = false;

          try {
            const refreshResponse = await refresh();
            success = refreshResponse.data.success;

            if (success) {
              onRefreshed(true);
            } else throw new Error("Unable to refresh token");
          } catch (refreshError) {
            onRefreshed(false);
            invalidAuth();
            return Promise.reject(refreshError as Error);
          }
        }

        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success: boolean) => {
            if (success) {
              token = getAccessToken();
              config.headers["Authorization"] = token;
              resolve(config);
            } else {
              reject(new Error("Unable to refresh token"));
            }
          });
        });
      } else if (!_refreshToken) {
        invalidAuth();
        throw new Error("No tokens");
      }

      config.headers["Authorization"] = token;
      return config;
    },
    (error) => Promise.reject(error as Error)
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiResponse>) => {
      const { response } = error;

      if (is5xxError(error)) {
        return Promise.reject(error);
      }

      if (response?.config.url === "/auth/refresh") invalidAuth();

      if (
        response?.status === 401 &&
        (response.data?.error === "EXPIRED_TOKEN" || response.data?.error === "UNAUTHORIZED") &&
        refreshToken()
      ) {
        const originalRequest = error.config!;

        if (!isRefreshing) {
          isRefreshing = true;
          refreshChannel.postMessage({ type: "refresh_start" });
          let success = false;

          try {
            const refreshResponse = await refresh();
            success = refreshResponse.data.success;

            if (success) {
              onRefreshed(true);
            } else throw new Error("Unable to refresh token");
          } catch (refreshError) {
            onRefreshed(false);
            invalidAuth();
            return Promise.reject(refreshError as Error);
          }
        }

        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success: boolean) => {
            if (success) resolve(api(originalRequest));
            else reject(new Error("Unable to refresh token"));
          });
        });
      } else if (response && response.status === 401 && router.currentRoute.value.path != "/login") {
        invalidAuth();
      }

      return Promise.reject(error);
    }
  );
};

export function waitForRefresh() {
  return new Promise<void>((resolve, reject) => {
    if (isRefreshing) {
      addRefreshSubscriber((success) => {
        if (success) {
          resolve();
        } else {
          reject(new Error("Failed refreshing token"));
        }
      });
    } else {
      resolve();
    }
  });
}

const rateLimitInterceptor = () => {
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 429) {
        try {
          const data = error.response.data as {
            success: boolean;
            data: { limit: number; reset: number };
            error: string;
          };

          const resetTime = data?.data?.reset;
          const delay = Math.max(0, resetTime * 1000 - Date.now());

          if (delay > 0) {
            console.warn(`Rate limited, waiting ${(delay / 1000).toFixed(1)}s before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          if (error.config) {
            return api.request(error.config);
          }
        } catch (e) {
          console.error("Failed to handle rate limit:", e);
        }
      }

      return Promise.reject(error);
    }
  );
};

function init(_api: AxiosInstance, _mainStore: mainStoreType) {
  api = _api;
  mainStore = _mainStore;
  authInterceptor();
  rateLimitInterceptor();
  connectionInterceptor();
}

export const refreshNow = async () => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshChannel.postMessage({ type: "refresh_start" });
    let success = false;

    try {
      const refreshResponse = await refresh();
      success = refreshResponse.data.success;

      if (success) {
        onRefreshed(true);
      } else throw new Error("Unable to refresh token");
    } catch (refreshError) {
      onRefreshed(false);
      invalidAuth();
      return Promise.reject(refreshError as Error);
    }
  }
};

export { init, connectionInterceptor, authInterceptor };
