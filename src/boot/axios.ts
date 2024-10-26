import { boot } from "quasar/wrappers";
import axios, { AxiosInstance } from "axios";
import { authEndpoints, getAuthToken } from "src/api/auth";

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $apiEndpoints: typeof apiEndpoints;
  }
}

const url = "http://localhost:6169/v1";
const api = axios.create({ baseURL: url, timeout: 5000, withCredentials: true });

const endpointsWithoutAuth = ["/auth/login", "/auth/register", "/auth/refresh"];

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

const apiEndpoints = {
  auth: authEndpoints
};

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  app.config.globalProperties.$apiEndpoints = apiEndpoints;
});

export { api, apiEndpoints };
