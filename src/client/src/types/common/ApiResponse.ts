export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Array<string>;
  timestamp?: Date;
  traceId?: string;
}

export interface ApiError {
  message?: string;
  errorCode?: number;
}
