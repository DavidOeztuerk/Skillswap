import { ApiResponse } from "./ApiResponse";

export interface PagedResponse<T> extends ApiResponse<T[]> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}