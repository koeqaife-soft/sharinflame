import type { RouteRecordRaw } from "vue-router";
import { refreshToken } from "src/api/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/register",
    component: () => import("layouts/MainLayout.vue"),
    props: { showDarkModeToggle: true },
    children: [{ path: "", component: () => import("pages/RegisterPage.vue") }]
  },
  {
    path: "/login",
    component: () => import("layouts/MainLayout.vue"),
    props: { showDarkModeToggle: true },
    children: [{ path: "", component: () => import("pages/LoginPage.vue") }]
  },
  {
    path: "/app",
    component: () => import("pages/AppPage.vue")
  },
  {
    path: "/",
    redirect: () => (refreshToken() ? "/app" : "/login")
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue")
  }
];

export default routes;
