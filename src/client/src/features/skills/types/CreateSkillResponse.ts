export interface CreateSkillResponse {
  skillId: string;
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  isOffered: boolean;
  status: string;
  createdAt: string;
}

export interface SkillCategoryResponse {
  categoryId: string;
  name: string;
  iconName?: string;
  color?: string;
  skillCount?: number;
  subcategories?: SkillSubcategoryResponse[];
}

export interface SkillSubcategoryResponse {
  id: string;
  name: string;
  iconName?: string;
  topics: SkillTopicResponse[];
}

export interface SkillTopicResponse {
  id: string;
  name: string;
  isFeatured: boolean;
  skillCount: number;
}

/**
 * Flattened topic option for Autocomplete selection
 */
export interface FlattenedTopicOption {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  fullPath: string; // "Category > Subcategory > Topic"
  isFeatured: boolean;
  skillCount: number;
}
