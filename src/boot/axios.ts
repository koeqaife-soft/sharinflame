import { boot } from "quasar/wrappers";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { authEndpoints, deleteAuthToken, getAuthToken, setAuthToken } from "src/api/auth";

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $apiEndpoints: typeof apiEndpoints;
  }
}

const url = "http://localhost:6169/v1";
const api = axios.create({ baseURL: url, timeout: 5000, withCredentials: true });

const initFunctions = [() => import("src/api/auth")];

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
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse>) => {
    const { response } = error;

    if (response && response.status === 401 && response.data?.error === "EXPIRED_TOKEN") {
      const originalRequest = error.config;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshResponse = await api.post<ResponseWithAccess>(authEndpoints.refresh);
          const newToken = refreshResponse.data.data.access;

          setAuthToken(newToken);
          onRefreshed(newToken);
        } catch (refreshError) {
          deleteAuthToken();
          subscribers.forEach((callback) => callback(null!));
          subscribers = [];
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
    }

    return Promise.reject(error);
  }
);

const apiEndpoints = {
  auth: authEndpoints
};

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  app.config.globalProperties.$apiEndpoints = apiEndpoints;
});

export { api, apiEndpoints };
