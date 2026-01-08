import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse, PagedResponse } from '../../../shared/types/api/UnifiedResponse';
import type { SkillSearchResultResponse } from '../../skills/types/SkillResponses';
import type { PublicProfileResponse, UserReviewResponse, UserReviewStatsResponse } from '../types';

export interface UploadAvatarResponse {
  userId: string;
  avatarUrl: string;
  uploadedAt: string;
}

export interface DeleteAvatarResponse {
  userId: string;
  success: boolean;
  message: string;
}

// Profile Completeness Types (Phase 13)
export interface ProfileCompletenessItem {
  key: string;
  label: string;
  isCompleted: boolean;
  weight: number;
  points: number;
  hint?: string;
  actionUrl?: string;
  icon?: string;
}

export type ProfileCompletenessLevel =
  | 'Beginner'
  | 'Basic'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert';

export interface ProfileCompletenessResponse {
  userId: string;
  percentage: number;
  totalPoints: number;
  earnedPoints: number;
  completedCount: number;
  totalCount: number;
  level: ProfileCompletenessLevel;
  items: ProfileCompletenessItem[];
  suggestedActions: ProfileCompletenessItem[];
  calculatedAt: string;
}

/**
 * Service for public profile operations
 */
export const profileService = {
  /**
   * Get public profile of another user (no auth required)
   */
  async getPublicProfile(userId: string): Promise<ApiResponse<PublicProfileResponse>> {
    return apiClient.get<PublicProfileResponse>(`/api/users/public/${userId}`);
  },

  /**
   * Get skills of a specific user
   */
  async getUserSkills(
    userId: string,
    params?: {
      isOffered?: boolean;
      pageNumber?: number;
      pageSize?: number;
      locationType?: 'remote' | 'in_person' | 'both';
      categoryId?: string;
    }
  ): Promise<PagedResponse<SkillSearchResultResponse>> {
    const queryParams: Record<string, unknown> = {
      PageNumber: params?.pageNumber ?? 1,
      PageSize: params?.pageSize ?? 12,
    };

    if (params?.isOffered !== undefined) {
      queryParams.IsOffered = params.isOffered;
    }

    if (params?.locationType) {
      queryParams.LocationType = params.locationType;
    }

    if (params?.categoryId) {
      queryParams.CategoryId = params.categoryId;
    }

    return apiClient.getPaged<SkillSearchResultResponse>(`/api/skills/user/${userId}`, queryParams);
  },

  /**
   * Get reviews/ratings for a user (from AppointmentService)
   */
  async getUserReviews(
    userId: string,
    pageNumber = 1,
    pageSize = 10,
    starFilter?: number
  ): Promise<PagedResponse<UserReviewResponse>> {
    const params: Record<string, unknown> = {
      pageNumber,
      pageSize,
    };

    if (starFilter !== undefined) {
      params.starFilter = starFilter;
    }

    return apiClient.getPaged<UserReviewResponse>(`/api/reviews/user/${userId}`, params);
  },

  /**
   * Get review statistics for a user (rating distribution for histogram)
   */
  async getUserReviewStats(userId: string): Promise<ApiResponse<UserReviewStatsResponse>> {
    return apiClient.get<UserReviewStatsResponse>(`/api/reviews/user/${userId}/stats`);
  },

  /**
   * Upload avatar image
   * @param file The image file to upload
   */
  async uploadAvatar(file: File): Promise<ApiResponse<UploadAvatarResponse>> {
    // Convert file to base64
    const imageData = await fileToBase64Array(file);

    return apiClient.post<UploadAvatarResponse>('/api/users/profile/avatar', {
      imageData,
      fileName: file.name,
      contentType: file.type,
    });
  },

  /**
   * Delete current avatar
   */
  async deleteAvatar(): Promise<ApiResponse<DeleteAvatarResponse>> {
    return apiClient.delete<DeleteAvatarResponse>('/api/users/profile/avatar');
  },

  /**
   * Get profile completeness score and suggestions (Phase 13)
   */
  async getProfileCompleteness(): Promise<ApiResponse<ProfileCompletenessResponse>> {
    return apiClient.get<ProfileCompletenessResponse>('/api/users/profile/completeness');
  },
};

/**
 * Convert File to byte array (number[]) for API transmission
 */
async function fileToBase64Array(file: File): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const byteArray = [...new Uint8Array(arrayBuffer)];
      resolve(byteArray);
    });

    reader.addEventListener('error', () => {
      reject(new Error('Failed to read file'));
    });

    reader.readAsArrayBuffer(file);
  });
}
