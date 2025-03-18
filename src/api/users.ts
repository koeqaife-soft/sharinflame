import type { AxiosInstance } from "axios";

let api: AxiosInstance;

export const usersEndpoints = {
  profile_me: "/users/me",
  get_profile: (id: string) => `/users/${id}`,
  favorites: "/users/me/favorites",
  reactions: "/users/me/reactions",
  follow: (id: string) => `/users/me/following/${id}`,
  following: "/users/me/following"
};

async function getProfile(user_id?: string) {
  if (!user_id) {
    return await api.get<ResponseWithUser>(usersEndpoints.profile_me);
  } else {
    return await api.get<ResponseWithUser>(usersEndpoints.get_profile(user_id));
  }
}

async function updateProfile(values: UpdateProfileValues) {
  return await api.patch(usersEndpoints.profile_me, values);
}

async function addPostToFavorites(id: string) {
  return await api.post(usersEndpoints.favorites, { post_id: id });
}

async function remPostFromFavorites(id: string) {
  return await api.delete(usersEndpoints.favorites, { params: { post_id: id } });
}

async function addCommentToFavorites(post_id: string, id: string) {
  return await api.post(usersEndpoints.favorites, { post_id: post_id, comment_id: id });
}

async function remCommentFromFavorites(post_id: string, id: string) {
  return await api.delete(usersEndpoints.favorites, { params: { post_id: post_id, comment_id: id } });
}

async function getFavorites(type?: "posts" | "comments", cursor?: string) {
  return await api.get<ListsResponse>(usersEndpoints.favorites, {
    params: {
      ...(type && { type }),
      ...(cursor && { cursor }),
      preload: "true"
    }
  });
}

async function getReactions(isLike?: boolean, type?: "posts" | "comments", cursor?: string) {
  return await api.get<ListsResponse>(usersEndpoints.reactions, {
    params: {
      ...(type && { type }),
      ...(cursor && { cursor }),
      ...(isLike !== undefined && { is_like: isLike }),
      preload: "true"
    }
  });
}

async function getFollowing(cursor?: string) {
  return await api.get<FollowingResponse>(usersEndpoints.following, {
    params: {
      ...(cursor && { cursor }),
      preload: "true"
    }
  });
}

async function follow(userId: string) {
  return await api.post(usersEndpoints.follow(userId));
}

async function unfollow(userId: string) {
  return await api.delete(usersEndpoints.follow(userId));
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
  unfollow
};
