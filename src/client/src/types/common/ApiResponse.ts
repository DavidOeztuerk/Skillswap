export interface ApiResponse<T> {
  success: boolean;  // Backend uses "Success" with capital S, but JSON serialization makes it lowercase
  data: T;
  message?: string;
  errors?: string[];
  timestamp?: string;
  traceId?: string;
}
