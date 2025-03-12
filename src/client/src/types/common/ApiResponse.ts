export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errorCode?: number;
}

export interface ApiError {
  message?: string;
  errorCode?: number;
}
