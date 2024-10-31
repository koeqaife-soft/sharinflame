import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const postsEndpoints = {
  create_post: "/posts",
  popular: "/posts/popular",
  post: (id: number) => `/posts/${id}`,
  post_reactions: (id: number) => `/posts/${id}/reactions`,
  view: "/posts/view"
};

export const getPostsTypes = {
  popular: postsEndpoints.popular
};

async function getPost(id: number) {
  const r = await api.get<ResponseWithPost>(postsEndpoints.post(id));
  return r;
}

async function getPosts(type: keyof typeof getPostsTypes) {
  const r = await api.get<ApiResponse<{ posts: PostMinimal[] }>>(getPostsTypes[type]);
  return r;
}

async function viewPosts(postIds: number[] | string[]) {
  const data = { posts: postIds };
  const r = await api.post<ApiResponse>(postsEndpoints.view, data);
  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export { init, getPost, getPosts, viewPosts };
