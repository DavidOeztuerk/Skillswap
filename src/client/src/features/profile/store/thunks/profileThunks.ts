import { apiClient } from '../../../../core/api/apiClient';
import { createAppAsyncThunk } from '../../../../core/store/thunkHelpers';
import { isSuccessResponse, isPagedResponse } from '../../../../shared/types/api/UnifiedResponse';
import { profileService } from '../../services/profileService';
import {
  type PaginationState,
  type PublicProfile,
  type UserReview,
  type UserExperience,
  type UserEducation,
  mapPublicProfileResponse,
  mapReviewResponse,
  mapExperienceResponse,
  mapEducationResponse,
} from '../profileAdapter+State';
import type {
  UserExperienceResponse,
  UserEducationResponse,
  UserReviewStatsResponse,
} from '../../types';

// ===== FETCH PUBLIC PROFILE =====

export const fetchPublicProfile = createAppAsyncThunk<PublicProfile, string>(
  'profile/fetchPublicProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await profileService.getPublicProfile(userId);

      if (!isSuccessResponse(response)) {
        console.error('❌ [fetchPublicProfile] Not a success response');
        return rejectWithValue(response);
      }

      return mapPublicProfileResponse(response.data);
    } catch (error) {
      console.error('❌ [fetchPublicProfile] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch profile'],
        errorCode: 'FETCH_PROFILE_ERROR',
      });
    }
  }
);

// ===== FETCH PROFILE REVIEWS =====

export const fetchProfileReviews = createAppAsyncThunk<
  { reviews: UserReview[]; pagination: PaginationState },
  { userId: string; pageNumber?: number; pageSize?: number; starFilter?: number }
>(
  'profile/fetchProfileReviews',
  async ({ userId, pageNumber = 1, pageSize = 5, starFilter }, { rejectWithValue }) => {
    try {
      const response = await profileService.getUserReviews(
        userId,
        pageNumber,
        pageSize,
        starFilter
      );

      if (!isSuccessResponse(response)) {
        console.error('❌ [fetchProfileReviews] Not a success response');
        return rejectWithValue(response);
      }

      if (!isPagedResponse(response)) {
        console.error('❌ [fetchProfileReviews] Not a paged response');
        return rejectWithValue({
          success: false,
          errors: ['Invalid response format - expected paged response'],
          errorCode: 'INVALID_RESPONSE_FORMAT',
        });
      }

      // Handle both flat array and nested data structures
      const rawData = Array.isArray(response.data)
        ? response.data
        : ((response.data as { data?: unknown[] }).data ?? []);

      const reviews = rawData.map((r) =>
        mapReviewResponse(r as Parameters<typeof mapReviewResponse>[0])
      );

      const pagination: PaginationState = {
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
        totalRecords: response.totalRecords,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
      };

      return { reviews, pagination };
    } catch (error) {
      console.error('❌ [fetchProfileReviews] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch reviews'],
        errorCode: 'FETCH_REVIEWS_ERROR',
      });
    }
  }
);

// ===== FETCH PROFILE REVIEW STATS =====

export const fetchProfileReviewStats = createAppAsyncThunk<
  UserReviewStatsResponse,
  string // userId
>('profile/fetchProfileReviewStats', async (userId, { rejectWithValue }) => {
  try {
    const response = await profileService.getUserReviewStats(userId);

    if (!isSuccessResponse(response)) {
      console.error('❌ [fetchProfileReviewStats] Not a success response');
      return rejectWithValue(response);
    }

    return response.data;
  } catch (error) {
    console.error('❌ [fetchProfileReviewStats] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to fetch review stats'],
      errorCode: 'FETCH_REVIEW_STATS_ERROR',
    });
  }
});

// ===== FETCH OWN EXPERIENCE =====

export const fetchOwnExperience = createAppAsyncThunk<UserExperience[]>(
  'profile/fetchOwnExperience',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<UserExperienceResponse[]>(
        '/api/users/profile/me/experience'
      );

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data.map(mapExperienceResponse);
    } catch (error) {
      console.error('❌ [fetchOwnExperience] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch experience'],
        errorCode: 'FETCH_EXPERIENCE_ERROR',
      });
    }
  }
);

// ===== FETCH OWN EDUCATION =====

export const fetchOwnEducation = createAppAsyncThunk<UserEducation[]>(
  'profile/fetchOwnEducation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<UserEducationResponse[]>(
        '/api/users/profile/me/education'
      );

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data.map(mapEducationResponse);
    } catch (error) {
      console.error('❌ [fetchOwnEducation] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch education'],
        errorCode: 'FETCH_EDUCATION_ERROR',
      });
    }
  }
);

// ===== SAVE EXPERIENCE =====

interface SaveExperiencePayload {
  title: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  sortOrder?: number;
}

export const saveExperience = createAppAsyncThunk<
  UserExperience,
  { id?: string; data: SaveExperiencePayload }
>('profile/saveExperience', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = id
      ? await apiClient.put<UserExperienceResponse>(`/api/users/profile/me/experience/${id}`, data)
      : await apiClient.post<UserExperienceResponse>('/api/users/profile/me/experience', data);

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    return mapExperienceResponse(response.data);
  } catch (error) {
    console.error('❌ [saveExperience] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to save experience'],
      errorCode: 'SAVE_EXPERIENCE_ERROR',
    });
  }
});

// ===== DELETE EXPERIENCE =====

export const deleteExperience = createAppAsyncThunk<string, string>(
  'profile/deleteExperience',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/api/users/profile/me/experience/${id}`);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return id;
    } catch (error) {
      console.error('❌ [deleteExperience] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to delete experience'],
        errorCode: 'DELETE_EXPERIENCE_ERROR',
      });
    }
  }
);

// ===== SAVE EDUCATION =====

interface SaveEducationPayload {
  degree: string;
  institution: string;
  graduationYear?: number | null;
  graduationMonth?: number | null;
  description?: string | null;
  sortOrder?: number;
}

export const saveEducation = createAppAsyncThunk<
  UserEducation,
  { id?: string; data: SaveEducationPayload }
>('profile/saveEducation', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = id
      ? await apiClient.put<UserEducationResponse>(`/api/users/profile/me/education/${id}`, data)
      : await apiClient.post<UserEducationResponse>('/api/users/profile/me/education', data);

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    return mapEducationResponse(response.data);
  } catch (error) {
    console.error('❌ [saveEducation] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to save education'],
      errorCode: 'SAVE_EDUCATION_ERROR',
    });
  }
});

// ===== DELETE EDUCATION =====

export const deleteEducation = createAppAsyncThunk<string, string>(
  'profile/deleteEducation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/api/users/profile/me/education/${id}`);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return id;
    } catch (error) {
      console.error('❌ [deleteEducation] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to delete education'],
        errorCode: 'DELETE_EDUCATION_ERROR',
      });
    }
  }
);
