import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { SkillCategory } from "../../types/models/Skill";
import { RequestState } from "../../types/common/RequestState";

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
