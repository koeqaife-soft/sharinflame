import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const usersEndpoints = {
  profile_me: "/users/me",
  get_profile: (id: string) => `/users/${id}`,
  favorite_posts: (id: string) => `/users/me/favorites/posts/${id}`,
  favorite_comments: (id: string) => `/users/me/favorites/comments/${id}`
};

async function getProfile(user_id?: string) {
  if (!user_id) {
    return await api.get<ResponseWithUser>(usersEndpoints.profile_me);
  } else {
    return await api.get<ResponseWithUser>(usersEndpoints.get_profile(user_id));
  }
}

async function updateProfile(values: UpdateProfileValues) {
  return await api.post(usersEndpoints.profile_me, values);
}

async function addPostToFavorites(id: string) {
  return await api.post(usersEndpoints.favorite_posts(id));
}

async function remPostFromFavorites(id: string) {
  return await api.delete(usersEndpoints.favorite_posts(id));
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export { init, getProfile, updateProfile, addPostToFavorites, remPostFromFavorites };
