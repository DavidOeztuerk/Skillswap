export interface PaginatedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  success: boolean;
  data: T[];
  message: string | null;
  errors: string[] | null;
  timestamp: string;
  traceId?: string | null;
}