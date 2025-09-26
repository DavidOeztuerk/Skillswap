import skillService from "../../api/services/skillsService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { PagedSuccessResponse, isPagedResponse } from "../../types/api/UnifiedResponse";
import { GetUserSkillResponse, SkillSearchResultResponse } from "../../types/contracts/responses/SkillResponses";

// Async thunks
export const fetchUserSearchResults = createAppAsyncThunk<PagedSuccessResponse<GetUserSkillResponse>, { pageNumber?: number; pageSize?: number }>(
  'search/fetchUserSearchResults',
  async ({ pageNumber = 1, pageSize = 12 } = {}, { rejectWithValue }) => {
    const response = await skillService.getUserSkills(pageNumber, pageSize);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

export const fetchAllSkills = createAppAsyncThunk<PagedSuccessResponse<SkillSearchResultResponse>, { pageNumber?: number; pageSize?: number }>(
  'search/fetchAllSkills',
  async ({ pageNumber = 1, pageSize = 12 } = {}, { rejectWithValue }) => {
    const response = await skillService.getAllSkills({ pageNumber, pageSize });
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);