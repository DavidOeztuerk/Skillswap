import skillService from '../../../api/services/skillsService';
import { createAppAsyncThunk } from '../../../store/thunkHelpers';
import { type SuccessResponse, isSuccessResponse } from '../../../types/api/UnifiedResponse';
import type { ProficiencyLevelResponse } from '../../../types/contracts/responses/CreateSkillResponse';
import type { ProficiencyLevel } from '../../../types/models/Skill';

export const fetchProficiencyLevels = createAppAsyncThunk<
  SuccessResponse<ProficiencyLevelResponse[]>
>('proficiencyLevels/fetchProficiencyLevels', async (_, { rejectWithValue }) => {
  const response = await skillService.getProficiencyLevels();
  return isSuccessResponse(response) ? response : rejectWithValue(response);
});

export const createProficiencyLevel = createAppAsyncThunk<
  SuccessResponse<ProficiencyLevel>,
  { level: string; rank: number; description?: string }
>(
  'proficiencyLevels/createProficiencyLevel',
  async ({ level, rank, description }, { rejectWithValue }) => {
    const response = await skillService.createProficiencyLevel(level, rank, description);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const updateProficiencyLevel = createAppAsyncThunk<
  SuccessResponse<ProficiencyLevel>,
  { id: string; level: string; rank: number; description?: string }
>(
  'proficiencyLevels/updateProficiencyLevel',
  async ({ id, level, rank, description }, { rejectWithValue }) => {
    const response = await skillService.updateProficiencyLevel(id, level, rank, description);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const deleteProficiencyLevel = createAppAsyncThunk<SuccessResponse<void>, string>(
  'proficiencyLevels/deleteProficiencyLevel',
  async (id, { rejectWithValue }) => {
    const response = await skillService.deleteProficiencyLevel(id);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);
