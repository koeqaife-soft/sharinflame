import type { AxiosInstance, AxiosRequestConfig } from "axios";

let api: AxiosInstance;

export const postsEndpoints = {
  create_post: "/posts",
  popular: "/posts/popular",
  new_posts: "/posts/new",
  following: "/posts/following",
  post: (id: string) => `/posts/${id}`,
  post_reactions: (id: string) => `/posts/${id}/reactions`,
  view: "/posts/view",
  get_posts_batch: "/posts/batch",
  comments: (post_id: string) => `/posts/${post_id}/comments`,
  comment_actions: (post_id: string, comment_id: string) => `/posts/${post_id}/comments/${comment_id}`,
  comment_reactions: (post_id: string, comment_id: string) => `/posts/${post_id}/comments/${comment_id}/reactions`,
  get_user_posts: (user_id: string) => `/users/${user_id}/posts`,
  get_comment: (post_id: string, comment_id: string) => `/posts/${post_id}/comments/${comment_id}`,
  get_tag_posts: (name: string) => `/tags/${name}/posts`,
  get_tag: (name: string) => `/tags/${name}`
};

export const getPostsTypes = {
  popular: postsEndpoints.popular,
  new: postsEndpoints.new_posts,
  following: postsEndpoints.following
};

export type KeyOfGetPostsTypes = keyof typeof getPostsTypes;

async function getPost(id: string, config: AxiosRequestConfig = {}) {
  return await api.get<ResponseWithPost>(postsEndpoints.post(id), config);
}

async function deletePost(id: string, config: AxiosRequestConfig = {}) {
  return await api.delete<ApiResponse>(postsEndpoints.post(id), config);
}

async function editPost(
  id: string,
  { content, tags }: { content?: string | undefined; tags?: string[] | undefined },
  config: AxiosRequestConfig = {}
) {
  return await api.patch(
    postsEndpoints.post(id),
    {
      ...(content && { content }),
      ...(tags && { tags })
    },
    config
  );
}

async function getPostsBatch(posts: string[], config: AxiosRequestConfig = {}) {
  const originalOrderMap = new Map(posts.map((id, index) => [id, index]));

  const sortedPosts = [...posts].sort();

  const params = { posts: sortedPosts.join(",") };
  const r = await api.get<GetPostsBatchResponse>(postsEndpoints.get_posts_batch, {
    params: params,
    ...config
  });

  if (r.data.success) {
    const restoredOrder = r.data.data.posts.sort((a, b) => {
      const indexA = originalOrderMap.get(a.post_id);
      const indexB = originalOrderMap.get(b.post_id);
      return (indexA ?? 0) - (indexB ?? 0);
    });
    r.data.data.posts = restoredOrder;
  }

  return r;
}

async function getPosts(
  type: KeyOfGetPostsTypes,
  cursor?: string,
  hide_viewed?: boolean,
  config: AxiosRequestConfig = {}
) {
  return await api.get<ApiResponse<{ posts: string[]; next_cursor: string }>>(getPostsTypes[type], {
    params: {
      ...(cursor && { cursor }),
      ...(hide_viewed !== undefined && { hide_viewed })
    },
    ...config
  });
}

async function viewPosts(postIds: string[], config: AxiosRequestConfig = {}) {
  return await api.post<ApiResponse>(postsEndpoints.view, { posts: postIds }, config);
}

async function setReaction(
  postId: string,
  { commentId, isLike }: { commentId?: string | undefined; isLike: boolean },
  config: AxiosRequestConfig = {}
) {
  const data = { is_like: isLike };
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  return await api.post(endpoint, data, config);
}

async function remReaction(postId: string, commentId?: string, config: AxiosRequestConfig = {}) {
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  return await api.delete(endpoint, config);
}

async function createComment(
  post_id: string,
  content: string,
  type?: string,
  config: AxiosRequestConfig = {},
  parent_id?: string
) {
  const data = { content, ...(type && { type }), ...(parent_id && { parent_id }) };
  return await api.post<ApiResponse<Comment>>(postsEndpoints.comments(post_id), data, config);
}

async function deleteComment(post_id: string, comment_id: string, config: AxiosRequestConfig = {}) {
  return await api.delete(postsEndpoints.comment_actions(post_id, comment_id), config);
}

async function getComments(
  post_id: string,
  cursor?: string,
  type?: string,
  config: AxiosRequestConfig = {},
  parent_id?: string
) {
  return await api.get<GetCommentsResponse>(postsEndpoints.comments(post_id), {
    params: {
      ...(cursor && { cursor }),
      ...(type && { type }),
      ...(parent_id && { parent_id })
    },
    ...config
  });
}

async function getComment(post_id: string, comment_id: string, config: AxiosRequestConfig = {}) {
  return await api.get<ApiResponse<CommentWithUser>>(postsEndpoints.get_comment(post_id, comment_id), config);
}

async function getUserPosts(
  user_id: string,
  cursor?: string,
  sort?: "new" | "old" | "popular",
  config: AxiosRequestConfig = {}
) {
  return await api.get<GetUserPostsResponse>(postsEndpoints.get_user_posts(user_id), {
    params: {
      ...(cursor && { cursor }),
      ...(sort && { sort })
    },
    ...config
  });
}

async function createPost(values: CreatePostValues, config: AxiosRequestConfig = {}) {
  return await api.post<ApiResponse<Post>>(postsEndpoints.create_post, values, config);
}

async function getTagPosts(name: string, cursor?: string, config: AxiosRequestConfig = {}) {
  return await api.get<ApiResponse<{ posts: string[]; next_cursor: string }>>(postsEndpoints.get_tag_posts(name), {
    params: {
      ...(cursor && { cursor })
    },
    ...config
  });
}

async function getTag(name: string, config: AxiosRequestConfig = {}) {
  return await api.get<ApiResponse<Tag>>(postsEndpoints.get_tag(name), config);
}

function init(_api: AxiosInstance) {
  api = _api;
}

export {
  init,
  getPost,
  getPosts,
  editPost,
  viewPosts,
  getPostsBatch,
  setReaction,
  remReaction,
  createComment,
  getComments,
  getUserPosts,
  createPost,
  deletePost,
  deleteComment,
  getComment,
  getTagPosts,
  getTag
};
