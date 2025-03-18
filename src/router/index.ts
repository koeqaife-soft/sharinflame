import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from "vue-router";

import routes from "./routes";
import { useMainStore } from "src/stores/main-store";

let mainStore: ReturnType<typeof useMainStore>;

const createHistory = process.env.SERVER
  ? createMemoryHistory
  : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

const router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,

  // quasar.conf.js -> build -> vueRouterMode
  // quasar.conf.js -> build -> publicPath
  history: createHistory(process.env.VUE_ROUTER_BASE)
});

router.beforeEach((to, from, next) => {
  if (!mainStore) mainStore = useMainStore();

  if (mainStore.initialized === 0 && to.path !== "/") {
    next({ path: "/" });
  } else if (to.path !== "/login" && to.path !== "/register" && to.path !== "/" && mainStore.initialized === 1) {
    next({ path: "/login" });
  } else if ((to.path === "/login" || to.path === "/register") && mainStore.initialized === 2) {
    next({ path: "/app" });
  } else {
    next();
  }
});

export default router;
