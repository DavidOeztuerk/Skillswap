import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './store';
import type { ErrorResponse } from '../../shared/types/api/UnifiedResponse';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  rejectValue: ErrorResponse;
  state: RootState;
  dispatch: AppDispatch;
}>();
