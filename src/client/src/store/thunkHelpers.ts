import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ErrorResponse } from '../types/api/UnifiedResponse';
import type { AppDispatch, RootState } from './store';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  rejectValue: ErrorResponse;
  state: RootState;
  dispatch: AppDispatch;
}>();
