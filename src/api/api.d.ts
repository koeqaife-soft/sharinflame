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
  avatar_context_id?: string | null;
  banner_context_id?: string | null;
  bio?: string;
  languages?: string[];
}

type UserPermission =
  | "MODERATE_POSTS"
  | "MODERATE_COMMENTS"
  | "MODERATE_PROFILES"
  | "BAN_USERS"
  | "RED_BUTTON"
  | "RECOVER_POSTS"
  | "RECOVER_COMMENTS"
  | "ADMIN_PANEL";

interface User {
  user_id: string;
  username: string;
  followers_count?: number;
  following_count?: number;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  badges?: number[];
  languages?: string[];
  created_at: number;
  followed?: true;
  role_id?: number;
  permissions?: UserPermission[];
}

interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  email_verified: boolean;
  pending_email?: string;
  pending_email_until?: number;
}

interface Post {
  post_id: string;
  user_id: string;
  content: string;
  created_at: number;
  updated_at: number;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  tags: string[];
  media: string[];
  ctags: string[];
  is_like?: boolean | undefined;
  is_system?: boolean | undefined;
  is_fav?: boolean | undefined;
  media_type: "post_video" | "post_image";

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
  is_fav?: undefined;

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
  content?: string | undefined;
  parent_comment_id?: string | undefined;
  replies_count: number;
  likes_count: number;
  dislikes_count: number;
  is_like?: boolean | undefined;
  is_fav?: boolean | undefined;
  created_at: number;
  type?: "update" | "comment" | undefined;
  _meta?: MetaData | undefined;
  user?: User | undefined;
  replies?: CommentWithUser[] | undefined;
}

interface Tag {
  tag_id: string;
  name: string;
  created_at: number;
  posts_count: number;
}

type CommentWithUser = Comment & {
  user: User;
};

type PostWithSystem = Post | (PostSystem & { is_system: true });

interface CreatePostValues {
  content: string;
  tags?: string[];
  file_context_id?: string;
  ctags?: string[];
}

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
type ListsResponse = ApiResponse<
  {
    errors?: [post_id: string | null, comment_id: string | null, error_msg: string][];
    next_cursor: string;
    has_more: boolean;
  } & (
    | { posts: Post[]; comments?: undefined }
    | { comments: CommentWithUser[]; posts?: undefined }
    | { posts?: undefined; comments?: undefined }
  )
>;
type FollowingResponse = ApiResponse<{
  errors?: [followed_to: string, error_msg: string][];
  next_cursor: string;
  has_more: boolean;
  following: User[];
}>;

interface BaseNotification {
  id: string;
  from_id: string;
  message: string;
  type: "new_comment" | "followed";
  linked_id: string;
  second_linked_id: string;
  unread: boolean;
}

interface ModAuditBase {
  id: string;
  target_id: string;
  action_type: string;
  reason: string;
  appellation_status: "none" | "pending" | "rejected" | "approved";
  user: User;
  created_at: number;
}

type ModAudit =
  | (ModAuditBase & { target_type: "post"; old_content: Post })
  | (ModAuditBase & { target_type: "comment"; old_content: Comment });

type ApiNotification =
  | (BaseNotification & { linked_type: "post"; loaded: Post })
  | (BaseNotification & { linked_type: "comment"; loaded: CommentWithUser })
  | (BaseNotification & { linked_type: "mod_audit"; loaded: { user: User; [key: string]: unknown } & ModAudit })
  | (BaseNotification & { linked_type: undefined; loaded: undefined });

type NotificationsResponse = ApiResponse<{
  notifications: ApiNotification[];
  next_cursor: string;
  has_more: boolean;
}>;

type CreateContextType = "post_video" | "post_image";

interface WebPushNotification {
  id: string;
  type: string;
  username: string;
  avatar_url: string;
  message: string;
  is_reply?: string;
}

interface UserChannel {
  user_id: string;
  channel_id: string;
  membership_id: string;
  last_read_message_id: str;
  last_read_at: number;
  joined_at: number;
  metadata?: string;
  type: "direct" | "group";
  created_at: number;
  members: User[];
  __meta?: Record<string, string>;
}

interface Message {
  message_id: string;
  channel_id: string;
  user_id: string;
  content: string;
  content_type: "plain" | "encrypted";
  file_context_id?: string;
  created_at: number;
  edited_at?: number;
  media?: string[];
}
