import { AxiosInstance } from "axios";

let api: AxiosInstance;

export const postsEndpoints = {
  create_post: "/posts",
  popular: "/posts/popular",
  new_posts: "/posts/new",
  post: (id: string) => `/posts/${id}`,
  post_reactions: (id: string) => `/posts/${id}/reactions`,
  view: "/posts/view",
  get_posts_batch: "/posts/batch",
  comments: (post_id: string) => `/posts/${post_id}/comments`,
  comment_reactions: (post_id: string, comment_id: string) => `/posts/${post_id}/comments/${comment_id}/reactions`,
  get_user_posts: (user_id: string) => `/users/${user_id}/posts`
};

export const getPostsTypes = {
  popular: postsEndpoints.popular,
  new: postsEndpoints.new_posts
};

export type KeyOfGetPostsTypes = keyof typeof getPostsTypes;

async function getPost(id: string) {
  const r = await api.get<ResponseWithPost>(postsEndpoints.post(id));
  return r;
}

async function deletePost(id: string) {
  const r = await api.delete<ApiResponse>(postsEndpoints.post(id));
  return r;
}

async function getPostsBatch(posts: string[]) {
  const params = { posts: posts.join(",") };
  const r = await api.get<GetPostsBatchResponse>(postsEndpoints.get_posts_batch, {
    params: params
  });
  return r;
}

async function getPosts(type: KeyOfGetPostsTypes) {
  const r = await api.get<ApiResponse<{ posts: PostMinimal[] }>>(getPostsTypes[type]);
  return r;
}

async function viewPosts(postIds: string[]) {
  const data = { posts: postIds };
  const r = await api.post<ApiResponse>(postsEndpoints.view, data);
  return r;
}

async function setReaction(postId: string, { commentId, isLike }: { commentId?: string; isLike: boolean }) {
  const data = { is_like: isLike };
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  const r = await api.post(endpoint, data);
  return r;
}

async function remReaction(postId: string, commentId?: string) {
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  const r = await api.delete(endpoint);
  return r;
}

async function createComment(post_id: string, content: string) {
  const data = { content };
  const r = await api.post<ApiResponse<Comment>>(postsEndpoints.comments(post_id), data);
  return r;
}

async function getComments(post_id: string, cursor?: string) {
  const r = await api.get<GetCommentsResponse>(postsEndpoints.comments(post_id), {
    params: !!cursor ? { cursor } : undefined
  });
  return r;
}

async function getUserPosts(user_id: string, cursor?: string, sort?: "new" | "old" | "popular") {
  const r = await api.get<GetUserPostsResponse>(postsEndpoints.get_user_posts(user_id), {
    params: {
      ...(cursor && { cursor }),
      ...(sort && { sort })
    }
  });
  return r;
}

async function createPost(values: CreatePostValues) {
  const r = await api.post<ApiResponse<Post>>(postsEndpoints.create_post, values);
  return r;
}

async function init(_api: AxiosInstance) {
  api = _api;
}

export {
  init,
  getPost,
  getPosts,
  viewPosts,
  getPostsBatch,
  setReaction,
  remReaction,
  createComment,
  getComments,
  getUserPosts,
  createPost,
  deletePost
};
