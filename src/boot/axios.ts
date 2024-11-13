import { boot } from "quasar/wrappers";
import axios, { AxiosError, AxiosInstance, AxiosResponse, isAxiosError } from "axios";
import { authEndpoints, refresh } from "src/api/auth";
import { postsEndpoints } from "src/api/posts";
import router from "src/router";
import { useMainStore } from "src/stores/main-store";
import { watch } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $apiEndpoints: typeof apiEndpoints;
  }
}

let mainStore: ReturnType<typeof useMainStore>;
const url = "http://localhost:6169/v1";
const api = axios.create({ baseURL: url, timeout: 5000, withCredentials: true });

const initFunctions = [() => import("src/api/auth"), () => import("src/api/posts"), () => import("src/api/users")];

async function initialize() {
  await Promise.all(
    initFunctions.map(async (initFunction) => {
      const module = await initFunction();
      return module.init(api);
    })
  );
}

initialize();

const apiEndpoints = {
  auth: authEndpoints,
  posts: postsEndpoints,
  ping: "/ping"
};

let isRefreshing = false;
let refreshTimeout: NodeJS.Timeout | null = null;
let subscribers: Array<(success: boolean) => void> = [];

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

function isConnectionError(e: AxiosError) {
  return !e.response || e.code === "ECONNABORTED";
}

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

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse>) => {
    const { response } = error;

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
          clearSubscribers();
          router.push({ path: "/login" });
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
    } else if (response && response.status === 401) {
      clearSubscribers();
      router.push({ path: "/login" });
    }

    return Promise.reject(error);
  }
);

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  app.config.globalProperties.$apiEndpoints = apiEndpoints;
  mainStore = useMainStore();
});

export { api, apiEndpoints };
