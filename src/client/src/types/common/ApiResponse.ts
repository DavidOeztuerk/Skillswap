export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  timestamp?: string;
  traceId?: string;
}
