interface ApiResponse<T = { [key: string]: unknown }> {
  success: boolean;
  error?: string;
  data: T;
}

type AuthResponse = ApiResponse<{ access: string; refresh: string }>;
interface MetaData {
  cache?: {
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface UpdateProfileValues {
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  gender?: string;
  languages?: string[];
}

interface User {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  gender?: string;
  languages?: string[];
  created_at: number;
}

interface Post {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  tags: string[];
  media: string[];
  status: string;
  is_deleted: boolean;
  is_like?: boolean;
  is_system?: boolean;

  created_at_unix: number;
  updated_at_unix: number;

  user: User;
  _meta?: MetaData;
  actions: undefined;
}

type PostWithoutUser = Omit<Post, "user"> & {
  user: undefined;
};

interface PostSystem {
  post_id: string;
  content: string;
  is_system: true;
  actions?: {
    name: string;
    icon: string;
    func: () => void;
  }[];
  _meta?: MetaData;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  dislikes_count: number;
  is_like?: boolean;
}

type CommentWithUser = Comment & {
  user: User;
};

type PostWithSystem = Post | (PostSystem & { is_system: true });

type PostMinimal = [post_id: string, user_id: string];

type ResponseWithPost = ApiResponse<Post>;
type ResponseWithUser = ApiResponse<User>;
type GetPostsBatchResponse = ApiResponse<{ posts: Post[]; errors?: { post: string; error_msg: string }[] }>;
type GetCommentsResponse = ApiResponse<{
  comments: Comment[];
  next_cursor: string;
  users: {
    [key: string]: User;
  };
  has_more: boolean;
}>;
type GetUserPostsResponse = ApiResponse<{
  posts: PostWithoutUser[];
  next_cursor: string;
  has_more: boolean;
}>;
