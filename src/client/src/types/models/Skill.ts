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
  endorsementCount?: number;
  location?: string;
  isRemoteAvailable: boolean;
  estimatedDurationMinutes?: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface SkillCategory {
  categoryId: string;
  name: string;
  description?: string;
  iconName?: string;
  color?: string;
  sortOrder?: number;
  skillCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProficiencyLevel {
  levelId: string;
  level: string;
  description?: string;
  rank: number;
  color?: string;
  skillCount?: number;
  isActive: boolean;
  createdAt: string;
}
