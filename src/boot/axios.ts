import { boot } from "quasar/wrappers";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { authEndpoints, deleteAuthToken, getAuthToken, refresh } from "src/api/auth";
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

const endpointsWithoutAuth = [authEndpoints.login, authEndpoints.register, authEndpoints.refresh];
let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  subscribers.forEach((callback) => callback(token));
  subscribers = [];
};

const clearSubscribers = () => {
  subscribers.forEach((callback) => callback(null!));
  subscribers = [];
};

const addSubscriber = (callback: (token: string) => void) => {
  subscribers.push(callback);
};

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    const requiresAuth = !endpointsWithoutAuth.some((endpoint) => config.url?.includes(endpoint));

    if (token && requiresAuth) {
      config.headers["Authorization"] = token;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    mainStore.setIsOffline(false);
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    if (!error.response || error.code === "ECONNABORTED") {
      const config = error.config!;
      mainStore.setIsOffline(true);
      if (!config.url?.includes("/ping"))
        return new Promise((resolve) => {
          const watching = watch(
            () => mainStore.isOffline,
            async (newValue) => {
              if (!newValue) {
                try {
                  const retryResponse = await axios(config);
                  resolve(retryResponse);
                  watching.stop();
                } catch {
                  mainStore.setIsOffline(true);
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
      const originalRequest = error.config;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshResponse = await refresh();
          const newToken = refreshResponse.data.data.access;

          if (newToken) {
            onRefreshed(newToken);
            originalRequest!.headers["Authorization"] = newToken;
            return api(originalRequest!);
          } else throw new Error("No new token received");
        } catch (refreshError) {
          deleteAuthToken();
          clearSubscribers();
          router.push({ path: "/login" });
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        addSubscriber((newToken) => {
          if (newToken) {
            originalRequest!.headers["Authorization"] = newToken;
            resolve(api(originalRequest!));
          } else {
            reject(new Error("Unable to refresh token"));
          }
        });
      });
    } else if (response && response.status === 401) {
      deleteAuthToken();
      clearSubscribers();
      router.push({ path: "/login" });
    }

    return Promise.reject(error);
  }
);

const apiEndpoints = {
  auth: authEndpoints,
  posts: postsEndpoints,
  ping: "/ping"
};

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  app.config.globalProperties.$apiEndpoints = apiEndpoints;
  mainStore = useMainStore();
});

export { api, apiEndpoints };
