import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const usersEndpoints = {
  profile_me: "/users/me",
  get_profile: (id: string) => `/users/${id}`
};

async function getProfile(user_id?: string) {
  if (!user_id) {
    const r = await api.get<ResponseWithUser>(usersEndpoints.profile_me);
    return r;
  } else {
    const r = await api.get<ResponseWithUser>(usersEndpoints.get_profile(user_id));
    return r;
  }
}

async function updateProfile(values: UpdateProfileValues) {
  const r = await api.post(usersEndpoints.profile_me, values);
  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export { init, getProfile, updateProfile };
