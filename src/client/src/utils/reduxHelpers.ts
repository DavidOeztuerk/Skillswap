// import axios from 'axios';
// import { ApiError } from '../api/apiClient';

// // export interface SliceError {
// //   message: string;
// //   code?: string;
// //   details?: string;
// //   statusCode?: number;
// // }

// /**
//  * Serializes errors for consistent handling across Redux slices
//  * @param error - The error to serialize
//  * @returns Serialized error object
//  */
// export const serializeError = (error: unknown): ApiError => {
//   if (axios.isAxiosError(error)) {
//     return {
//       message: error.response?.data?.message || error.message,
//       errorCode: error.response?.status?.toString() || 'AXIOS_ERROR',
//       details: typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data || {}),
//       statusCode: error.response?.status || 0,
//     };
//   }
  
//   if (error instanceof Error) {
//     return {
//       message: error.message,
//       code: 'ERROR',
//       details: error.stack
//     };
//   }

//   if (typeof error === 'string') {
//     return {
//       message: error,
//       code: 'STRING_ERROR'
//     };
//   }

//   return {
//     message: 'An unexpected error occurred',
//     code: 'UNKNOWN_ERROR',
//     details: JSON.stringify(error)
//   };
// };

// /**
//  * Gets a human-readable error message from a SliceError
//  * @param error - The SliceError to extract message from
//  * @returns Human-readable error message
//  */
// export const getErrorMessage = (error: SliceError | null): string => {
//   if (!error) return '';
//   return error.message || 'An unexpected error occurred';
// };