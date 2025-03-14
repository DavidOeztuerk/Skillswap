export interface PaginatedResponse<T> {
  results: never[];
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
