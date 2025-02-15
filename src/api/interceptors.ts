import { isAxiosError } from "axios";
import type { AxiosError, AxiosResponse, AxiosInstance } from "axios";
import type { useMainStore } from "src/stores/main-store";
import { watch } from "vue";
import router from "src/router";
import { refresh, getAccessToken, noAuthEndpoints, refreshToken, clientLogout } from "src/api/auth";

let api: AxiosInstance;
type mainStoreType = ReturnType<typeof useMainStore>;
let mainStore: mainStoreType;

function is5xxError(error: AxiosError) {
  const response = error.response;
  return response && response.status >= 500 && response.status < 600;
}

const connectionInterceptor = () => {
  const isConnectionError = (e: AxiosError) => {
    return !e.response || e.code === "ECONNABORTED";
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

const authInterceptor = () => {
  let isRefreshing = false;
  let subscribers: Array<(success: boolean) => void> = [];
  let lastRefresh: number = 0;

  const invalidAuth = () => {
    clearSubscribers();
    clientLogout();
  };

  const onRefreshed = () => {
    lastRefresh = Date.now();
    subscribers.forEach((callback) => callback(true));
    subscribers = [];
    isRefreshing = false;
  };

  const clearSubscribers = () => {
    subscribers.forEach((callback) => callback(false));
    subscribers = [];
  };

  const addSubscriber = (callback: (success: boolean) => void) => {
    if (Date.now() - lastRefresh <= 15000) {
      setTimeout(() => callback(true), 100);
      return;
    }
    subscribers.push(callback);
  };

  api.interceptors.request.use(
    async (config) => {
      if (!config.url || noAuthEndpoints.includes(config.url)) return config;

      let token = getAccessToken();
      const _refreshToken = refreshToken();

      if (!token && _refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          let success = false;

          try {
            const refreshResponse = await refresh();
            success = refreshResponse.data.success;

            if (success) {
              onRefreshed();
            } else throw new Error("Unable to refresh token");
          } catch (refreshError) {
            invalidAuth();
            return Promise.reject(refreshError as Error);
          }
        }

        return new Promise((resolve, reject) => {
          addSubscriber((success: boolean) => {
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
          let success = false;

          try {
            const refreshResponse = await refresh();
            success = refreshResponse.data.success;

            if (success) {
              onRefreshed();
            } else throw new Error("Unable to refresh token");
          } catch (refreshError) {
            invalidAuth();
            return Promise.reject(refreshError as Error);
          }
        }

        return new Promise((resolve, reject) => {
          addSubscriber((success: boolean) => {
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

function init(_api: AxiosInstance, _mainStore: mainStoreType) {
  api = _api;
  mainStore = _mainStore;
  authInterceptor();
  connectionInterceptor();
}

export { init, connectionInterceptor, authInterceptor };
