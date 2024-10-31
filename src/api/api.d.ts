interface ApiResponse<T = { [key: string]: unknown }> {
  success: boolean;
  error?: string;
  data: T;
}

type ResponseWithAccess = ApiResponse<{ access: string }>;

interface User {
  user_id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  gender?: string;
  languages?: string[];
}

interface Post {
  post_id: number;
  user_id: number;
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

  created_at_unix: number;
  updated_at_unix: number;

  user: User;
}

type PostMinimal = [post_id: number, user_id: number];

type ResponseWithPost = ApiResponse<Post>;
type ResponseWithUser = ApiResponse<User>;
