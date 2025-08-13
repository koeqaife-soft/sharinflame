import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const usersEndpoints = {
  profile_me: "/users/me",
  get_profile: (id: string) => `/users/${id}`,
  favorites: "/users/me/favorites",
  reactions: "/users/me/reactions",
  follow: (id: string) => `/users/me/following/${id}`,
  following: "/users/me/following",
  notifications: "/users/me/notifications"
};

async function getProfile(user_id?: string, config: AxiosRequestConfig = {}) {
  if (!user_id) {
    return await api.get<ResponseWithUser>(usersEndpoints.profile_me, config);
  } else {
    return await api.get<ResponseWithUser>(usersEndpoints.get_profile(user_id), config);
  }
}

async function updateProfile(values: UpdateProfileValues, config: AxiosRequestConfig = {}) {
  return await api.patch(usersEndpoints.profile_me, values, config);
}

async function addPostToFavorites(id: string, config: AxiosRequestConfig = {}) {
  return await api.post(usersEndpoints.favorites, { post_id: id }, config);
}

async function remPostFromFavorites(id: string, config: AxiosRequestConfig = {}) {
  return await api.delete(usersEndpoints.favorites, { params: { post_id: id }, ...config });
}

async function addCommentToFavorites(post_id: string, id: string, config: AxiosRequestConfig = {}) {
  return await api.post(usersEndpoints.favorites, { post_id: post_id, comment_id: id }, config);
}

async function remCommentFromFavorites(post_id: string, id: string, config: AxiosRequestConfig = {}) {
  return await api.delete(usersEndpoints.favorites, { params: { post_id: post_id, comment_id: id }, ...config });
}

async function getFavorites(type?: "posts" | "comments", cursor?: string, config: AxiosRequestConfig = {}) {
  return await api.get<ListsResponse>(usersEndpoints.favorites, {
    params: {
      ...(type && { type }),
      ...(cursor && { cursor }),
      preload: "true"
    },
    ...config
  });
}

async function getReactions(
  isLike?: boolean,
  type?: "posts" | "comments",
  cursor?: string,
  config: AxiosRequestConfig = {}
) {
  return await api.get<ListsResponse>(usersEndpoints.reactions, {
    params: {
      ...(type && { type }),
      ...(cursor && { cursor }),
      ...(isLike !== undefined && { is_like: isLike }),
      preload: "true"
    },
    ...config
  });
}

async function getFollowing(cursor?: string, config: AxiosRequestConfig = {}) {
  return await api.get<FollowingResponse>(usersEndpoints.following, {
    params: {
      ...(cursor && { cursor }),
      preload: "true"
    },
    ...config
  });
}

async function getNotifications(cursor?: string, limit?: number, config: AxiosRequestConfig = {}) {
  return await api.get<NotificationsResponse>(usersEndpoints.notifications, {
    params: {
      ...(cursor && { cursor }),
      ...(limit && { limit }),
      preload: "true"
    },
    ...config
  });
}

async function follow(userId: string, config: AxiosRequestConfig = {}) {
  return await api.post(usersEndpoints.follow(userId), undefined, config);
}

async function unfollow(userId: string, config: AxiosRequestConfig = {}) {
  return await api.delete(usersEndpoints.follow(userId), config);
}

function init(_api: AxiosInstance) {
  api = _api;
}

export {
  init,
  getProfile,
  updateProfile,
  addPostToFavorites,
  remPostFromFavorites,
  addCommentToFavorites,
  remCommentFromFavorites,
  getFavorites,
  getReactions,
  getFollowing,
  follow,
  unfollow,
  getNotifications
};
