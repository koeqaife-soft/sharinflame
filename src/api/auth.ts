import { api } from "src/boot/axios";

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
  const r = await api.post(authEndpoints.register, {
    username: username,
    password: password,
    email: email
  });
  if (r.data?.success) setAuthToken(r.data!.data.access);
  return r;
}

async function login(email: string, password: string) {
  const r = await api.post(authEndpoints.login, {
    password: password,
    email: email
  });
  if (r.data?.success) setAuthToken(r.data!.data.access);
  return r;
}

export { getAuthToken, setAuthToken, deleteAuthToken, register, login };
