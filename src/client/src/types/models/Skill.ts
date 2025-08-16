export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string;
  isOffered: boolean;
  category: SkillCategory;
  proficiencyLevel: ProficiencyLevel;
  tagsJson: string;
  averageRating?: number;
  reviewCount?: number;
  estimatedDurationMinutes?: number;
  endorsementCount: number;
  createdAt: string;
  lastActiveAt?: string;
  matchRequests?: number;
  activeMatches?: number;
  completionRate?: number;
  isVerified?: boolean;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  skillCount?: number;
}

export interface ProficiencyLevel {
  id: string;
  level: string;
  rank: number;
  color?: string;
  skillCount?: number;
}
