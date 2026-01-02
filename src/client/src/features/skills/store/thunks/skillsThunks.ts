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
import type {
  SkillSearchParams,
  SkillSearchResultResponse,
  GetUserSkillResponse,
} from '../../types/SkillResponses';
import type { UpdateSkillRequest } from '../../types/UpdateSkillRequest';

export const fetchAllSkills = createAppAsyncThunk<
  { skills: Skill[]; pagination: PaginationState },
  SkillSearchParams
>('skills/fetchAllSkills', async (params, { rejectWithValue }) => {
  try {
    const response = await skillService.getAllSkills(params);

    if (!isSuccessResponse(response)) {
      console.error('❌ [fetchAllSkills] Not a success response');
      return rejectWithValue(response);
    }

    if (!isPagedResponse(response)) {
      console.error('❌ [fetchAllSkills] Not a paged response');
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - expected paged response'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    // Handle both flat array and nested data structures
    const rawData = Array.isArray(response.data)
      ? response.data
      : ((response.data as { data?: SkillSearchResultResponse[] }).data ?? []);

    if (!Array.isArray(rawData)) {
      console.error('❌ [fetchAllSkills] response.data is not an array');
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - data is not an array'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    const skills = rawData.map(mapSkillResponseToSkill);
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
      locationType?: string;
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
      params?.locationType,
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

    // Handle both flat array and nested data structures
    const rawUserData = Array.isArray(response.data)
      ? response.data
      : ((response.data as { data?: GetUserSkillResponse[] }).data ?? []);

    if (!Array.isArray(rawUserData)) {
      console.error('❌ [fetchUserSkills] response.data is not an array');
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - data is not an array'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    const skills = rawUserData.map(mapUserSkillsResponseToSkill);
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
        console.error('❌ [fetchSkillById] Not a success response');
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
        createdAt: new Date(skillData.createdAt).toLocaleDateString('de-DE'),
        lastActiveAt: new Date(skillData.updatedAt).toLocaleDateString('de-DE'),
        // Exchange options
        exchangeType: skillData.exchangeType,
        desiredSkillCategoryId: skillData.desiredSkillCategoryId,
        desiredSkillDescription: skillData.desiredSkillDescription,
        hourlyRate: skillData.hourlyRate,
        currency: skillData.currency,
        // Scheduling
        preferredDays: skillData.preferredDays,
        preferredTimes: skillData.preferredTimes,
        sessionDurationMinutes: skillData.sessionDurationMinutes,
        totalSessions: skillData.totalSessions,
        // Location
        locationType: skillData.locationType,
        locationAddress: skillData.locationAddress,
        locationCity: skillData.locationCity,
        locationPostalCode: skillData.locationPostalCode,
        locationCountry: skillData.locationCountry,
        maxDistanceKm: skillData.maxDistanceKm,
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
  async (skillData, { rejectWithValue, getState }) => {
    try {
      const response = await skillService.createSkill(skillData);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Get category and proficiency level from Redux state
      const state = getState();
      const { categories } = state.category;
      const { proficiencyLevels } = state.proficiencyLevel;

      // Map CreateSkillResponse to Skill - using actual response structure
      const created = response.data;

      // Look up category and proficiency level details from Redux state
      const categoryData = categories.find((c) => c.id === created.categoryId);
      const proficiencyData = proficiencyLevels.find((p) => p.id === created.proficiencyLevelId);

      const skill: Skill = {
        id: created.skillId,
        userId: '', // Not included in CreateSkillResponse
        name: created.name,
        description: created.description,
        isOffered: created.isOffered,
        category: {
          id: created.categoryId || '',
          name: categoryData?.name ?? '',
          iconName: categoryData?.iconName,
          color: categoryData?.color,
        },
        proficiencyLevel: {
          id: created.proficiencyLevelId || '',
          level: proficiencyData?.level ?? '',
          rank: proficiencyData?.rank ?? 0,
          color: proficiencyData?.color,
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
>('skills/updateSkill', async ({ skillId, updateData }, { rejectWithValue, getState }) => {
  try {
    const response = await skillService.updateSkill(skillId, updateData);

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    // Get category and proficiency level from Redux state
    const state = getState();
    const { categories } = state.category;
    const { proficiencyLevels } = state.proficiencyLevel;

    // Map UpdateSkillResponse to Skill - using actual response structure
    const updated = response.data;

    // Look up category and proficiency level details from Redux state
    const categoryData = categories.find((c) => c.id === updated.categoryId);
    const proficiencyData = proficiencyLevels.find((p) => p.id === updated.proficiencyLevelId);

    const skill: Skill = {
      id: updated.id,
      userId: '', // Not included in UpdateSkillResponse
      name: updated.name,
      description: updated.description,
      isOffered: updated.isOffered,
      category: {
        id: updated.categoryId || '',
        name: categoryData?.name ?? '',
        iconName: categoryData?.iconName,
        color: categoryData?.color,
      },
      proficiencyLevel: {
        id: updated.proficiencyLevelId || '',
        level: proficiencyData?.level ?? '',
        rank: proficiencyData?.rank ?? 0,
        color: proficiencyData?.color,
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

export const fetchFavoriteSkills = createAppAsyncThunk<
  { skillIds: string[]; skills: Skill[]; pagination: PaginationState },
  { pageNumber?: number; pageSize?: number } | undefined
>('skills/fetchFavoriteSkills', async (params, { rejectWithValue }) => {
  try {
    const response = await skillService.getFavoriteSkills(
      params?.pageNumber ?? 1,
      params?.pageSize ?? 12
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

    // Handle both flat array and nested data structures
    // Note: Backend returns SkillSearchResultResponse, NOT GetUserSkillResponse
    const rawData = Array.isArray(response.data)
      ? response.data
      : ((response.data as { data?: SkillSearchResultResponse[] }).data ?? []);

    if (!Array.isArray(rawData)) {
      return rejectWithValue({
        success: false,
        errors: ['Invalid response format - data is not an array'],
        errorCode: 'INVALID_RESPONSE_FORMAT',
      });
    }

    // Use mapSkillResponseToSkill because backend returns SkillSearchResultResponse
    const skills = rawData.map(mapSkillResponseToSkill);
    const skillIds = skills.map((s) => s.id);
    const pagination: PaginationState = {
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      totalRecords: response.totalRecords,
      hasNextPage: response.hasNextPage,
      hasPreviousPage: response.hasPreviousPage,
    };

    return { skillIds, skills, pagination };
  } catch (error) {
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to fetch favorite skills'],
      errorCode: 'FETCH_FAVORITE_SKILLS_ERROR',
    });
  }
});

export const toggleFavoriteSkill = createAppAsyncThunk<
  { skillId: string; isFavorite: boolean },
  { skillId: string; isFavorite: boolean }
>('skills/toggleFavoriteSkill', async ({ skillId, isFavorite }, { rejectWithValue }) => {
  try {
    if (isFavorite) {
      const response = await skillService.addFavoriteSkill(skillId);
      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }
    } else {
      const response = await skillService.removeFavoriteSkill(skillId);
      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }
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
