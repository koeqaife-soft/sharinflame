interface ApiResponse<T = { [key: string]: unknown }> {
  success: boolean;
  error?: string;
  data: T;
}

type ResponseWithAccess = ApiResponse<{ access: string }>;
