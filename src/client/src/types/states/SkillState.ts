import { SkillRecommendation, SkillStatistics } from '../../api/services/skillsService';
import { RequestState } from '../common/RequestState';
import { ProficiencyLevel, Skill, SkillCategory } from '../models/Skill';

export interface SkillState extends RequestState {
  allSkills: Skill[] | undefined;
  userSkills: Skill[] | undefined;
  favoriteSkillIds: string[];
  selectedSkill: Skill | null;
  searchQuery: string;
  searchResults: Skill[];
  isSearchActive: boolean;
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statistics: SkillStatistics | null;
  recommendations: SkillRecommendation[];
  popularTags: Array<{ tag: string; count: number }>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface CategoriesState extends RequestState {
  categories: SkillCategory[];
  selectedCategory: SkillCategory | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface ProficiencyLevelsState extends RequestState {
  proficiencyLevels: ProficiencyLevel[];
  selectedProficiencyLevel: ProficiencyLevel | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
