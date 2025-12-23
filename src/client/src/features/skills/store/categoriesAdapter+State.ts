import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { SkillCategory } from '../types/Skill';

export const categoriesAdapter = createEntityAdapter<SkillCategory, EntityId>({
  selectId: (category) => category.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface CategoriesEntityState extends EntityState<SkillCategory, EntityId>, RequestState {
  categories: SkillCategory[];
  selectedCategory: SkillCategory | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const initialCategoriesState: CategoriesEntityState = categoriesAdapter.getInitialState({
  categories: [],
  selectedCategory: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isLoading: false,
  errorMessage: undefined,
});

export const categoriesSelectors = categoriesAdapter.getSelectors();
