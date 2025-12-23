import { createAppAsyncThunk } from '../../../core/store/thunkHelpers';
import {
  type PagedSuccessResponse,
  isPagedResponse,
} from '../../../shared/types/api/UnifiedResponse';
import { skillService } from '../../skills/services/skillsService';
import type {
  GetUserSkillResponse,
  SkillSearchResultResponse,
  SkillSearchParams,
} from '../../skills/types/SkillResponses';

// Async thunks
export const fetchUserSearchResults = createAppAsyncThunk<
  PagedSuccessResponse<GetUserSkillResponse>,
  { pageNumber?: number; pageSize?: number } | undefined
>('search/fetchUserSearchResults', async (params, { rejectWithValue }) => {
  const { pageNumber = 1, pageSize = 12 } = params ?? {};
  const response = await skillService.getUserSkills(pageNumber, pageSize);
  return isPagedResponse(response) ? response : rejectWithValue(response);
});

export const fetchAllSkills = createAppAsyncThunk<
  PagedSuccessResponse<SkillSearchResultResponse>,
  SkillSearchParams | undefined
>('search/fetchAllSkills', async (params, { rejectWithValue }) => {
  const { pageNumber = 1, pageSize = 12, ...rest } = params ?? {};
  const response = await skillService.getAllSkills({ pageNumber, pageSize, ...rest });
  return isPagedResponse(response) ? response : rejectWithValue(response);
});
