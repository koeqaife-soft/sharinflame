import { defineBoot } from "#q-app/wrappers";
import axios, { type AxiosInstance } from "axios";
import { useMainStore } from "src/stores/main-store";
import * as interceptors from "src/api/interceptors";
import { init as initAuth } from "src/api/auth";
import { init as initPosts } from "src/api/posts";
import { init as initUsers } from "src/api/users";
import { init as initStorage } from "src/api/storage";
import { init as initModeration } from "src/api/moderation";
import { apiUrl } from "src/api/config";

const initFunctions = [initAuth, initPosts, initUsers, initStorage, initModeration, interceptors.init];

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

let mainStore: ReturnType<typeof useMainStore>;

export const api = axios.create({ baseURL: apiUrl, timeout: 15000 });

async function initialize() {
  await Promise.all(
    initFunctions.map((initFunction) => {
      return initFunction(api, mainStore);
    })
  );
}

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
  mainStore = useMainStore();
  void initialize();
});
