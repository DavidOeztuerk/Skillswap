export interface PublicProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince: string;
  skillsOffered: number;
  skillsLearned: number;
  completedSessions?: number;
  averageRating: number;
  totalReviews: number;
  isBlocked: boolean;
  languages?: string[];
  timeZone?: string;
  experience?: UserExperienceResponse[];
  education?: UserEducationResponse[];
}

export interface UserExperienceResponse {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

export interface UserEducationResponse {
  id: string;
  degree: string;
  institution: string;
  graduationYear?: number;
  graduationMonth?: number;
  description?: string;
}

export interface UserReviewResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  reviewText?: string;
  skillName?: string;
  createdAt: string;
  // Section ratings
  knowledgeRating?: number;
  knowledgeComment?: string;
  teachingRating?: number;
  teachingComment?: string;
  communicationRating?: number;
  communicationComment?: string;
  reliabilityRating?: number;
  reliabilityComment?: string;
  // Additional fields
  wouldRecommend?: boolean;
  rateeResponse?: string;
  rateeResponseAt?: string;
}

export interface UserReviewStatsResponse {
  userId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // { 5: 45, 4: 23, 3: 10, 2: 5, 1: 2 }
  averageKnowledge?: number;
  averageTeaching?: number;
  averageCommunication?: number;
  averageReliability?: number;
}
