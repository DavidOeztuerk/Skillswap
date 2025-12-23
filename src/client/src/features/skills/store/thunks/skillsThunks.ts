import { createAppAsyncThunk } from '../../../../core/store/thunkHelpers';
import { isSuccessResponse, isPagedResponse } from '../../../../shared/types/api/UnifiedResponse';
import { withDefault } from '../../../../shared/utils/safeAccess';
import { skillService } from '../../services/skillsService';
import {
  type PaginationState,
  mapSkillResponseToSkill,
  mapUserSkillsResponseToSkill,
} from '../skillsAdapter+State';
import type { CreateSkillRequest } from '../../types/CreateSkillRequest';
import type { Skill } from '../../types/Skill';
import type { SkillSearchParams } from '../../types/SkillResponses';
import type { UpdateSkillRequest } from '../../types/UpdateSkillRequest';

export const fetchAllSkills = createAppAsyncThunk<
  { skills: Skill[]; pagination: PaginationState },
  SkillSearchParams
>('skills/fetchAllSkills', async (params, { rejectWithValue }) => {
  try {
    const response = await skillService.getAllSkills(params);
    if (!isSuccessResponse(response)) {
      console.error('❌ [fetchAllSkills] Not a success response:', response);
      return rejectWithValue(response);
    }

    if (!isPagedResponse(response)) {
      console.error('❌ [fetchAllSkills] Not a paged response:', response);
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - expected paged response'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    const skills = response.data.map(mapSkillResponseToSkill);
    const pagination: PaginationState = {
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      totalRecords: response.totalRecords,
      hasNextPage: response.hasNextPage,
      hasPreviousPage: response.hasPreviousPage,
    };

    return { skills, pagination };
  } catch (error) {
    console.error('❌ [fetchAllSkills] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to fetch all skills'],
      errorCode: 'FETCH_ALL_SKILLS_ERROR',
    });
  }
});

export const fetchUserSkills = createAppAsyncThunk<
  { skills: Skill[]; pagination: PaginationState },
  | {
      pageNumber?: number;
      pageSize?: number;
      isOffered?: boolean;
      categoryId?: string;
      proficiencyLevelId?: string;
      includeInactive?: boolean;
    }
  | undefined
>('skills/fetchUserSkills', async (params, { rejectWithValue }) => {
  try {
    const response = await skillService.getUserSkills(
      params?.pageNumber ?? 1,
      params?.pageSize ?? 12,
      params?.isOffered,
      params?.categoryId,
      params?.proficiencyLevelId,
      params?.includeInactive ?? false
    );

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    if (!isPagedResponse(response)) {
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - expected paged response'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    const skills = response.data.map(mapUserSkillsResponseToSkill);
    const pagination: PaginationState = {
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      totalRecords: response.totalRecords,
      hasNextPage: response.hasNextPage,
      hasPreviousPage: response.hasPreviousPage,
    };

    return { skills, pagination };
  } catch (error) {
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to fetch user skills'],
      errorCode: 'FETCH_USER_SKILLS_ERROR',
    });
  }
});

export const fetchSkillById = createAppAsyncThunk<Skill, string>(
  'skills/fetchSkillById',
  async (skillId, { rejectWithValue }) => {
    try {
      const response = await skillService.getSkillById(skillId);

      if (!isSuccessResponse(response)) {
        console.error('❌ [fetchSkillById] Not a success response:', response);
        return rejectWithValue(response);
      }

      // Map SkillDetailsResponse to Skill
      const skillData = response.data;
      const skill: Skill = {
        id: skillData.skillId,
        userId: skillData.userId,
        ownerUserName: skillData.ownerUserName,
        ownerFirstName: skillData.ownerFirstName,
        ownerLastName: skillData.ownerLastName,
        ownerRating: skillData.ownerRating,
        ownerMemberSince: skillData.ownerMemberSince?.toString(),
        name: skillData.name,
        description: skillData.description,
        isOffered: skillData.isOffered,
        category: {
          id: skillData.category.categoryId || '',
          name: skillData.category.name,
          iconName: skillData.category.iconName,
          color: skillData.category.color,
        },
        proficiencyLevel: {
          id: skillData.proficiencyLevel.levelId || '',
          level: skillData.proficiencyLevel.level,
          rank: withDefault(skillData.proficiencyLevel.rank, 0),
          color: skillData.proficiencyLevel.color,
        },
        tagsJson: skillData.tags.join(','),
        averageRating: withDefault(skillData.rating, 0),
        reviewCount: withDefault(skillData.reviews?.length, 0),
        endorsementCount: withDefault(skillData.endorsements?.length, 0),
        estimatedDurationMinutes: withDefault(skillData.preferredSessionDuration, 0),
        createdAt: skillData.createdAt.toLocaleDateString(),
        lastActiveAt: skillData.updatedAt.toLocaleDateString(),
      };

      return skill;
    } catch (error) {
      console.error('❌ [fetchSkillById] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch skill details'],
        errorCode: 'FETCH_SKILL_BY_ID_ERROR',
      });
    }
  }
);

export const createSkill = createAppAsyncThunk<Skill, CreateSkillRequest>(
  'skills/createSkill',
  async (skillData, { rejectWithValue }) => {
    try {
      const response = await skillService.createSkill(skillData);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Map CreateSkillResponse to Skill - using actual response structure
      const created = response.data;
      const skill: Skill = {
        id: created.skillId,
        userId: '', // Not included in CreateSkillResponse
        name: created.name,
        description: created.description,
        isOffered: created.isOffered,
        category: {
          id: created.categoryId || '',
          name: '', // Not included in CreateSkillResponse
          iconName: undefined,
          color: undefined,
        },
        proficiencyLevel: {
          id: created.proficiencyLevelId || '',
          level: '', // Not included in CreateSkillResponse
          rank: 0,
          color: undefined,
        },
        tagsJson: created.tags.join(','),
        averageRating: 0,
        reviewCount: 0,
        endorsementCount: 0,
        estimatedDurationMinutes: 0, // Not included in CreateSkillResponse
        createdAt: created.createdAt,
        lastActiveAt: undefined,
      };

      return skill;
    } catch (error) {
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to create skill'],
        errorCode: 'CREATE_SKILL_ERROR',
      });
    }
  }
);

export const updateSkill = createAppAsyncThunk<
  Skill,
  { skillId: string; updateData: UpdateSkillRequest }
>('skills/updateSkill', async ({ skillId, updateData }, { rejectWithValue }) => {
  try {
    const response = await skillService.updateSkill(skillId, updateData);

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    // Map UpdateSkillResponse to Skill - using actual response structure
    const updated = response.data;
    const skill: Skill = {
      id: updated.id,
      userId: '', // Not included in UpdateSkillResponse
      name: updated.name,
      description: updated.description,
      isOffered: updated.isOffered,
      category: {
        id: updated.categoryId || '',
        name: '', // Not included in UpdateSkillResponse
        iconName: undefined,
        color: undefined,
      },
      proficiencyLevel: {
        id: updated.proficiencyLevelId || '',
        level: '', // Not included in UpdateSkillResponse
        rank: 0,
        color: undefined,
      },
      tagsJson: '', // Not included in UpdateSkillResponse
      averageRating: 0,
      reviewCount: 0,
      endorsementCount: 0,
      estimatedDurationMinutes: 0,
      createdAt: undefined,
      lastActiveAt: undefined,
    };

    return skill;
  } catch (error) {
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to update skill'],
      errorCode: 'UPDATE_SKILL_ERROR',
    });
  }
});

export const deleteSkill = createAppAsyncThunk<string, { skillId: string; reason?: string }>(
  'skills/deleteSkill',
  async ({ skillId, reason }, { rejectWithValue }) => {
    try {
      const response = await skillService.deleteSkill(skillId, reason);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return skillId;
    } catch (error) {
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to delete skill'],
        errorCode: 'DELETE_SKILL_ERROR',
      });
    }
  }
);

export const fetchFavoriteSkills = createAppAsyncThunk<string[]>(
  'skills/fetchFavoriteSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillService.getFavoriteSkills();

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      if (!isPagedResponse(response)) {
        return rejectWithValue({
          success: false,
          errors: ['Invalid response format - expected paged response'],
          errorCode: 'INVALID_RESPONSE_FORMAT',
        });
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch favorite skills'],
        errorCode: 'FETCH_FAVORITE_SKILLS_ERROR',
      });
    }
  }
);

export const toggleFavoriteSkill = createAppAsyncThunk<
  { skillId: string; isFavorite: boolean },
  { skillId: string; isFavorite: boolean }
>('skills/toggleFavoriteSkill', async ({ skillId, isFavorite }, { rejectWithValue }) => {
  try {
    let response;
    if (isFavorite) {
      response = await skillService.addFavoriteSkill(skillId);
    } else {
      response = await skillService.removeFavoriteSkill(skillId);
    }

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    return { skillId, isFavorite };
  } catch (error) {
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to toggle favorite skill'],
      errorCode: 'TOGGLE_FAVORITE_SKILL_ERROR',
    });
  }
});

// === RATING & ENDORSEMENT OPERATIONS ===
export const rateSkill = createAppAsyncThunk<
  undefined,
  { skillId: string; rating: number; feedback?: string }
>(
  'skills/rateSkill',
  (_: { skillId: string; rating: number; feedback?: string }, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('rateSkill: Backend endpoint not implemented');
    return rejectWithValue({
      success: false,
      errors: ['Rate skill endpoint not implemented'],
      message: 'Rate skill endpoint not implemented',
    });
  }
);

export const endorseSkill = createAppAsyncThunk<
  undefined,
  { skillId: string; endorsement?: string }
>('skills/endorseSkill', (_: { skillId: string; endorsement?: string }, { rejectWithValue }) => {
  // This endpoint doesn't exist in backend
  console.warn('endorseSkill: Backend endpoint not implemented');
  return rejectWithValue({
    success: false,
    errors: ['Endorse skill endpoint not implemented'],
    message: 'Endorse skill endpoint not implemented',
  });
});
