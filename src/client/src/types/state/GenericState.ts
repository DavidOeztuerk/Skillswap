// /**
//  * Generische State-Pattern für konsistentes State-Management
//  */

// // Base Request State - für alle async Operationen
// export interface RequestState {
//   isLoading: boolean;
//   error: string | null;
// }

// // Paginated Request State - für Listen mit Pagination
// export interface PaginatedRequestState extends RequestState {
//   pagination: {
//     pageNumber: number;
//     pageSize: number;
//     totalPages: number;
//     totalRecords: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
//   };
// }

// // Entity State - für einzelne Entitäten (CRUD)
// export interface EntityState<T> extends RequestState {
//   entity: T | null;
//   lastUpdated?: string;
// }

// // Collection State - für Listen von Entitäten
// export interface CollectionState<T> extends PaginatedRequestState {
//   items: T[];
//   selectedId: string | null;
//   lastFetched?: string;
// }

// // Search State - für Such-Operationen
// export interface SearchState<T> extends PaginatedRequestState {
//   query: string;
//   results: T[];
//   filters: Record<string, unknown>;
//   lastSearchTime?: string;
// }

// // CRUD Operations State - für komplexe CRUD-Operationen
// export interface CrudState<T> extends CollectionState<T> {
//   creating: boolean;
//   updating: boolean;
//   deleting: boolean;
//   createError: string | null;
//   updateError: string | null;
//   deleteError: string | null;
// }

// // Initial State Factories
// export function createInitialRequestState(): RequestState {
//   return {
//     isLoading: false,
//     error: null,
//   };
// }

// export function createInitialPaginatedState(): PaginatedRequestState {
//   return {
//     ...createInitialRequestState(),
//     pagination: {
//       pageNumber: 1,
//       pageSize: 10,
//       totalPages: 0,
//       totalRecords: 0,
//       hasNextPage: false,
//       hasPreviousPage: false,
//     },
//   };
// }

// export function createInitialEntityState<T>(): EntityState<T> {
//   return {
//     ...createInitialRequestState(),
//     entity: null,
//   };
// }

// export function createInitialCollectionState<T>(): CollectionState<T> {
//   return {
//     ...createInitialPaginatedState(),
//     items: [],
//     selectedId: null,
//   };
// }

// export function createInitialSearchState<T>(): SearchState<T> {
//   return {
//     ...createInitialPaginatedState(),
//     query: '',
//     results: [],
//     filters: {},
//   };
// }

// export function createInitialCrudState<T>(): CrudState<T> {
//   return {
//     ...createInitialCollectionState<T>(),
//     creating: false,
//     updating: false,
//     deleting: false,
//     createError: null,
//     updateError: null,
//     deleteError: null,
//   };
// }

// // State Update Helpers
// export interface StateUpdateHelpers {
//   setLoading: (state: RequestState, loading: boolean) => void;
//   setError: (state: RequestState, error: string | null) => void;
//   setPagination: (state: PaginatedRequestState, pagination: PaginatedRequestState['pagination']) => void;
//   setEntity: <T>(state: EntityState<T>, entity: T | null) => void;
//   setItems: <T>(state: CollectionState<T>, items: T[]) => void;
//   addItem: <T>(state: CollectionState<T>, item: T) => void;
//   updateItem: <T>(state: CollectionState<T>, id: string, updates: Partial<T>) => void;
//   removeItem: <T>(state: CollectionState<T>, id: string) => void;
// }

// export const stateHelpers: StateUpdateHelpers = {
//   setLoading: (state, loading) => {
//     state.isLoading = loading;
//   },
  
//   setError: (state, error) => {
//     state.error = error;
//     state.isLoading = false;
//   },
  
//   setPagination: (state, pagination) => {
//     state.pagination = pagination;
//   },
  
//   setEntity: (state, entity) => {
//     state.entity = entity;
//     state.lastUpdated = new Date().toISOString();
//   },
  
//   setItems: (state, items) => {
//     state.items = items;
//     state.lastFetched = new Date().toISOString();
//   },
  
//   addItem: (state, item) => {
//     state.items.push(item);
//   },
  
//   updateItem: (state, id, updates) => {
//     const index = state.items.findIndex((item: any) => item.id === id);
//     if (index !== -1) {
//       Object.assign(state.items[index], updates);
//     }
//   },
  
//   removeItem: (state, id) => {
//     state.items = state.items.filter((item: any) => item.id !== id);
//   },
// };