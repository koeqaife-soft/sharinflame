import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const authEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  remove_cookies: "/auth/remove_cookies"
};

async function register(username: string, email: string, password: string) {
  const r = await api.post<ResponseWithAccess>(authEndpoints.register, {
    username: username,
    password: password,
    email: email
  });
  if (r.data.success) localStorage.setItem("auth", "1");
  return r;
}

async function login(email: string, password: string) {
  const r = await api.post<ResponseWithAccess>(authEndpoints.login, {
    password: password,
    email: email
  });
  if (r.data.success) localStorage.setItem("auth", "1");
  return r;
}

async function logout() {
  const r = await api.post<ResponseWithAccess>(authEndpoints.logout);
  localStorage.removeItem("auth");
  return r;
}

async function refresh() {
  const r = await api.post<ResponseWithAccess>(authEndpoints.refresh);
  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export { register, login, logout, refresh, init };
