import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const postsEndpoints = {
  create_post: "/posts",
  popular: "/posts/popular",
  new_posts: "/posts/new",
  post: (id: number) => `/posts/${id}`,
  post_reactions: (id: number) => `/posts/${id}/reactions`,
  view: "/posts/view",
  get_posts_batch: "/posts/batch"
};

export const getPostsTypes = {
  popular: postsEndpoints.popular,
  new: postsEndpoints.new_posts
};

export type KeyOfGetPostsTypes = keyof typeof getPostsTypes;

async function getPost(id: number) {
  const r = await api.get<ResponseWithPost>(postsEndpoints.post(id));
  return r;
}

async function getPostsBatch(posts: string[] | number[]) {
  const params = { posts: posts.join(",") };
  const r = await api.get<ApiResponse<{ posts: Post[] }>>(postsEndpoints.get_posts_batch, {
    params: params
  });
  return r;
}

async function getPosts(type: KeyOfGetPostsTypes) {
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

export { init, getPost, getPosts, viewPosts, getPostsBatch };
