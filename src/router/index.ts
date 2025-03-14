import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { refreshToken } from "src/api/auth";

import routes from "./routes";

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
  const isAuthenticated = refreshToken();

  if (to.path !== "/login" && to.path !== "/register" && !isAuthenticated) {
    next({ path: "/login" });
  } else if ((to.path === "/login" || to.path === "/register") && isAuthenticated) {
    next({ path: "/app" });
  } else {
    next();
  }
});

export default router;
