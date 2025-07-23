// src/store/types.ts
/**
 * Standardized Redux slice types and interfaces
 */

export interface SliceError {
  message: string;
  code?: string | number;
  timestamp?: string;
  details?: Record<string, unknown>;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BaseSliceState {
  isLoading: boolean;
  error: SliceError | null;
  lastUpdated?: string;
}

export interface SelectableSliceState<T> extends BaseSliceState {
  selectedItem: T | null;
}

export interface CollectionSliceState<T> extends BaseSliceState {
  items: T[];
  pagination?: PaginationInfo;
}

export interface OperationalLoadingState extends BaseSliceState {
  operations: {
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    fetching: boolean;
  };
}

/**
 * Standard action types for consistency across slices
 */
export interface SetLoadingAction {
  payload: boolean;
}

export interface SetErrorAction {
  payload: SliceError | null;
}

export interface SelectItemAction<T> {
  payload: T | null;
}

export interface UpdateItemAction<T> {
  payload: T;
}

export interface RemoveItemAction {
  payload: string; // item ID
}

/**
 * Standard selector types
 */
export type BaseSelectors<T extends BaseSliceState> = {
  selectIsLoading: (state: { [key: string]: T }) => boolean;
  selectError: (state: { [key: string]: T }) => SliceError | null;
  selectLastUpdated: (state: { [key: string]: T }) => string | undefined;
};

export type CollectionSelectors<T, S extends CollectionSliceState<T>> = BaseSelectors<S> & {
  selectAll: (state: { [key: string]: S }) => T[];
  selectById: (state: { [key: string]: S }, id: string) => T | undefined;
  selectPagination: (state: { [key: string]: S }) => PaginationInfo | undefined;
  selectTotal: (state: { [key: string]: S }) => number;
};

export type SelectableSelectors<T, S extends SelectableSliceState<T>> = BaseSelectors<S> & {
  selectSelectedItem: (state: { [key: string]: S }) => T | null;
  selectHasSelection: (state: { [key: string]: S }) => boolean;
};

/**
 * Utility functions for creating standardized actions
 */
export const createSliceError = (
  message: string,
  code?: string | number,
  details?: Record<string, unknown>
): SliceError => ({
  message,
  code,
  timestamp: new Date().toISOString(),
  details,
});

export const createPaginationInfo = (
  page: number,
  pageSize: number,
  totalItems: number
): PaginationInfo => ({
  page,
  pageSize,
  totalPages: Math.ceil(totalItems / pageSize),
  totalItems,
  hasNextPage: page * pageSize < totalItems,
  hasPreviousPage: page > 1,
});

/**
 * Standard loading state patterns
 */
export const initialLoadingState = {
  isLoading: false,
  error: null,
  lastUpdated: undefined,
} as const;

export const initialOperationalLoadingState = {
  ...initialLoadingState,
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    fetching: false,
  },
} as const;