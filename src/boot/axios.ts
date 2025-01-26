import { defineBoot } from "#q-app/wrappers";
import axios, { AxiosInstance } from "axios";
import { authEndpoints } from "src/api/auth";
import { postsEndpoints } from "src/api/posts";
import { useMainStore } from "src/stores/main-store";
import * as interceptors from "src/api/interceptors";
import { init as initAuth } from "src/api/auth";
import { init as initPosts } from "src/api/posts";
import { init as initUsers } from "src/api/users";

const initFunctions = [initAuth, initPosts, initUsers, interceptors.init];

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $apiEndpoints: typeof apiEndpoints;
  }
}

let mainStore: ReturnType<typeof useMainStore>;
const url = "https://koeqaife.ddns.net:6169/v1";
const api = axios.create({ baseURL: url, timeout: 15000 });

async function initialize() {
  await Promise.all(
    initFunctions.map(async (initFunction) => {
      return initFunction(api, mainStore);
    })
  );
}

const apiEndpoints = {
  auth: authEndpoints,
  posts: postsEndpoints,
  ping: "/ping"
};

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  app.config.globalProperties.$apiEndpoints = apiEndpoints;
  mainStore = useMainStore();
  initialize();
});

export { api, apiEndpoints };
