import { Skill } from "../../models/Skill";
import { ProficiencyLevelResponse, SkillCategoryResponse } from "./CreateSkillResponse";

export interface UserSkillResponseData {
    UserId: string;
    SkillId: string;
    Name: string;
    Description: string;
    Category: {
      CategoryId: string;
      Name: string;
      IconName?: string;
      Color?: string;
      SkillCount?: number;
    };
    ProficiencyLevel: {
      LevelId: string;
      Level: string;
      Rank: number;
      Color?: string;
      SkillCount?: number;
    };
    Tags: string[];
    IsOffered: boolean;
    AverageRating?: number;
    ReviewCount: number;
    EndorsementCount: number;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface SkillDetailsResponse {
  skillId: string;
  userId: string;
  name: string;
  description: string;
  category: SkillCategoryResponse;
  proficiencyLevel: ProficiencyLevelResponse;
  tags: string[];
  isOffered: boolean;
  rating?: number;
  reviews?: SkillReviewResponse[];
  endorsements?: SkillEndorsementResponse[];
  availableHours?: number;
  preferredSessionDuration?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillReviewResponse {
  reviewId: string;
  reviewerUserId: string;
  rating: number;
  comment?: string;
  tags: string[];
  createdAt: Date;
};

export interface SkillEndorsementResponse {
  endorsementId: string;
  endorserUserId: string;
  message?: string;
  createdAt: Date
};

export interface GetUserSkillResponse {
  skillId: string,
  userId: string,
  name: string,
  description: string,
  category : SkillCategoryResponse,
  proficiencyLevel: ProficiencyLevelResponse,
  tags: string[],
  isOffered: boolean,
  rating?: number,
  reviewCount: number,
  endorsementCount: number,
  status: string,
  createdAt: Date,
  updatedAt: Date
}

export interface SkillSearchResultResponse{
  skillId: string;
  userId: string;
  name: string;
  description: string;
  isOffered: boolean; 
  category : SkillCategoryResponse,
  proficiencyLevel: ProficiencyLevelResponse,
  tagsJson: string[],
  averageRating?: number,
  reviewCount: number,
  endorsementCount: number,
  estimatedDurationMinutes?: number,
  createdAt: Date,
  lastActiveAt?: Date  // Backend uses 'LastViewedAt' - might need to check this
}

export interface SkillSearchParams {
  searchTerm?: string;
  categoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];
  isOffered?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'createdAt' | 'updatedAt' | 'name' | 'category' | 'proficiencyLevel';
  sortDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

export interface SkillStatistics {
  totalSkills: number;
  skillsOffered: number;
  skillsRequested: number;
  activeSkills: number;
  topCategories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
  matchPercentage: number;
}