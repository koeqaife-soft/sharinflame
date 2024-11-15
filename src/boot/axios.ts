import { boot } from "quasar/wrappers";
import axios, { AxiosInstance } from "axios";
import { authEndpoints } from "src/api/auth";
import { postsEndpoints } from "src/api/posts";
import { useMainStore } from "src/stores/main-store";
import * as interceptors from "src/api/interceptors";

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $apiEndpoints: typeof apiEndpoints;
  }
}

let mainStore: ReturnType<typeof useMainStore>;
const url = "http://localhost:6169/v1";
const api = axios.create({ baseURL: url, timeout: 15000, withCredentials: true });

const initFunctions = [
  () => import("src/api/auth"),
  () => import("src/api/posts"),
  () => import("src/api/users"),
  () => interceptors
];

async function initialize() {
  await Promise.all(
    initFunctions.map(async (initFunction) => {
      const module = await initFunction();
      return module.init(api, mainStore);
    })
  );
}

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
  initialize();
});

export { api, apiEndpoints };
