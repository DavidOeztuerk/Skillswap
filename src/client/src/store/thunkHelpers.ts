import { createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorResponse } from '../types/api/UnifiedResponse';

// Type definitions for the store (to avoid circular dependency)
export type RootState = any; // Will be properly typed when store is created
export type AppDispatch = any; // Will be properly typed when store is created

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  rejectValue: ErrorResponse;
  state: RootState;
  dispatch: AppDispatch;
}>();