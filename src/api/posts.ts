import type { AxiosInstance } from "axios";

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
  get_comment: (post_id: string, comment_id: string) => `/posts/${post_id}/comments/${comment_id}`
};

export const getPostsTypes = {
  popular: postsEndpoints.popular,
  new: postsEndpoints.new_posts,
  following: postsEndpoints.following
};

export type KeyOfGetPostsTypes = keyof typeof getPostsTypes;

async function getPost(id: string) {
  return await api.get<ResponseWithPost>(postsEndpoints.post(id));
}

async function deletePost(id: string) {
  return await api.delete<ApiResponse>(postsEndpoints.post(id));
}

async function editPost(id: string, { content, tags }: { content?: string | undefined; tags?: string[] | undefined }) {
  return await api.patch(postsEndpoints.post(id), {
    ...(content && { content }),
    ...(tags && { tags })
  });
}

async function getPostsBatch(posts: string[]) {
  const originalOrderMap = new Map(posts.map((id, index) => [id, index]));

  const sortedPosts = [...posts].sort();

  const params = { posts: sortedPosts.join(",") };
  const r = await api.get<GetPostsBatchResponse>(postsEndpoints.get_posts_batch, {
    params: params
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

async function getPosts(type: KeyOfGetPostsTypes, cursor?: string, hide_viewed?: boolean) {
  return await api.get<ApiResponse<{ posts: string[]; next_cursor: string }>>(getPostsTypes[type], {
    params: {
      ...(cursor && { cursor }),
      ...(hide_viewed !== undefined && { hide_viewed })
    }
  });
}

async function viewPosts(postIds: string[]) {
  return await api.post<ApiResponse>(postsEndpoints.view, { posts: postIds });
}

async function setReaction(postId: string, { commentId, isLike }: { commentId?: string | undefined; isLike: boolean }) {
  const data = { is_like: isLike };
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  return await api.post(endpoint, data);
}

async function remReaction(postId: string, commentId?: string) {
  let endpoint: string;
  if (commentId) {
    endpoint = postsEndpoints.comment_reactions(postId, commentId);
  } else {
    endpoint = postsEndpoints.post_reactions(postId);
  }
  return await api.delete(endpoint);
}

async function createComment(post_id: string, content: string) {
  const data = { content };
  return await api.post<ApiResponse<Comment>>(postsEndpoints.comments(post_id), data);
}

async function deleteComment(post_id: string, comment_id: string) {
  return await api.delete(postsEndpoints.comment_actions(post_id, comment_id));
}

async function getComments(post_id: string, cursor?: string) {
  return await api.get<GetCommentsResponse>(postsEndpoints.comments(post_id), {
    params: cursor ? { cursor } : undefined
  });
}

async function getComment(post_id: string, comment_id: string) {
  return await api.get<ApiResponse<CommentWithUser>>(postsEndpoints.get_comment(post_id, comment_id));
}

async function getUserPosts(user_id: string, cursor?: string, sort?: "new" | "old" | "popular") {
  return await api.get<GetUserPostsResponse>(postsEndpoints.get_user_posts(user_id), {
    params: {
      ...(cursor && { cursor }),
      ...(sort && { sort })
    }
  });
}

async function createPost(values: CreatePostValues) {
  return await api.post<ApiResponse<Post>>(postsEndpoints.create_post, values);
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
  getComment
};
