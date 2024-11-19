import { RouteRecordRaw } from "vue-router";

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
    redirect: () => (!!localStorage.getItem("auth") ? "/app" : "/login")
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue")
  }
];

export default routes;
