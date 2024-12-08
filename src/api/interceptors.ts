import { AxiosError, AxiosResponse, isAxiosError, AxiosInstance } from "axios";
import { useMainStore } from "src/stores/main-store";
import { watch } from "vue";
import router from "src/router";
import { refresh, getAccessToken, clearTokens, noAuthEndpoints } from "src/api/auth";

let api: AxiosInstance;
type mainStoreType = ReturnType<typeof useMainStore>;
let mainStore: mainStoreType;

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
                      reject(e);
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

const refreshInterceptor = () => {
  let isRefreshing = false;
  let refreshTimeout: NodeJS.Timeout | null = null;
  let subscribers: Array<(success: boolean) => void> = [];

  const invalidAuth = () => {
    clearSubscribers();
    clearTokens();
    router.push({ path: "/login" });
  };

  const onRefreshed = () => {
    subscribers.forEach((callback) => callback(true));
    subscribers = [];
  };

  const clearSubscribers = () => {
    subscribers.forEach((callback) => callback(false));
    subscribers = [];
  };

  const addSubscriber = (callback: (success: boolean) => void) => {
    subscribers.push(callback);
  };

  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiResponse>) => {
      const { response } = error;

      if (response?.config.url === "/auth/refresh") invalidAuth();

      if (response && response.status === 401 && response.data?.error === "EXPIRED_TOKEN") {
        const originalRequest = error.config!;

        if (!isRefreshing) {
          isRefreshing = true;
          let success = false;

          try {
            const refreshResponse = await refresh();
            success = refreshResponse.data.success;

            if (success) {
              onRefreshed();
              return api(originalRequest);
            } else throw new Error("Unable to refresh token");
          } catch (refreshError) {
            invalidAuth();
            return Promise.reject(refreshError);
          } finally {
            if (refreshTimeout) clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
              isRefreshing = false;
              if (success) {
                onRefreshed();
              } else if (subscribers) {
                clearSubscribers();
              }
            }, 10000);
          }
        }

        return new Promise((resolve, reject) => {
          addSubscriber((success: boolean) => {
            if (success) resolve(api(originalRequest));
            else reject("Unable to refresh token");
          });
        });
      } else if (response && response.status === 401 && router.currentRoute.value.path != "/login") {
        invalidAuth();
      }

      return Promise.reject(error);
    }
  );
};

const authInterceptor = () => {
  api.interceptors.request.use(
    (config) => {
      if (!config.url || noAuthEndpoints.includes(config.url)) return config;

      const token = getAccessToken();
      if (token) {
        config.headers["Authorization"] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

async function init(_api: AxiosInstance, _mainStore: mainStoreType) {
  api = _api;
  mainStore = _mainStore;
  authInterceptor();
  connectionInterceptor();
  refreshInterceptor();
}

export { init, connectionInterceptor, refreshInterceptor };
