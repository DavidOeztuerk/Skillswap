import { createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorResponse } from '../types/api/UnifiedResponse';
import { AppDispatch, RootState } from './store';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  rejectValue: ErrorResponse;
  state: RootState;
  dispatch: AppDispatch;
}>();