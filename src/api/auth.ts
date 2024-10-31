import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const authEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout"
};

function getAuthToken() {
  return localStorage.getItem("access_token");
}

function setAuthToken(value: string) {
  localStorage.setItem("access_token", value);
}

function deleteAuthToken() {
  localStorage.removeItem("access_token");
}

async function register(username: string, email: string, password: string) {
  const r = await api.post<ResponseWithAccess>(authEndpoints.register, {
    username: username,
    password: password,
    email: email
  });
  if (r.data?.success) setAuthToken(r.data!.data.access);
  return r;
}

async function login(email: string, password: string) {
  const r = await api.post<ResponseWithAccess>(authEndpoints.login, {
    password: password,
    email: email
  });
  if (r.data?.success) setAuthToken(r.data!.data.access);
  return r;
}

async function logout() {
  const r = await api.post<ResponseWithAccess>(authEndpoints.logout);
  deleteAuthToken();
  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export { getAuthToken, setAuthToken, deleteAuthToken, register, login, logout, init };
