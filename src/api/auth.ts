import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const authEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout"
};
export const noAuthEndpoints = ["/auth/register", "/auth/login", "/auth/refresh"];

async function register(username: string, email: string, password: string) {
  const r = await api.post<AuthResponse>(authEndpoints.register, {
    username: username,
    password: password,
    email: email
  });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });

  return r;
}

async function login(email: string, password: string) {
  const r = await api.post<AuthResponse>(authEndpoints.login, {
    password: password,
    email: email
  });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });
  return r;
}

async function logout() {
  const r = await api.post<AuthResponse>(authEndpoints.logout);
  clearTokens();
  return r;
}

async function refresh() {
  const refresh_token = localStorage.getItem("refresh_token");
  const r = await api.post<AuthResponse>(authEndpoints.refresh, { refresh_token });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });

  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

function setTokens({ refresh, access }: { refresh?: string; access?: string }) {
  if (refresh) localStorage.setItem("refresh_token", refresh);
  if (access) localStorage.setItem("access_token", access);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

export { register, login, logout, refresh, init, setTokens, clearTokens, getAccessToken };
