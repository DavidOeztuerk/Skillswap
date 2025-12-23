import { type EntityState, type EntityId, createEntityAdapter } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { Skill } from '../../skills/types/Skill';
import type { SkillSearchParams } from '../../skills/types/SkillResponses';

export const searchAdapter = createEntityAdapter<Skill, EntityId>({
  selectId: (skill) => skill.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface SearchState extends EntityState<Skill, EntityId>, RequestState {
  results: Skill[];
  userResults: Skill[];
  allSkills: Skill[];
  userLoading: boolean;
  allSkillsLoading: boolean;
  currentQuery: string;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  userPagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  allSkillsPagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  lastSearchParams: SkillSearchParams | null;
}

export const initialPagination = {
  page: 1,
  pageSize: 12,
  totalItems: 0,
  totalPages: 0,
};

export const initialSearchState: SearchState = searchAdapter.getInitialState({
  results: [],
  userResults: [],
  allSkills: [],
  isLoading: false,
  userLoading: false,
  allSkillsLoading: false,
  errorMessage: undefined,
  currentQuery: '',
  pagination: { ...initialPagination },
  userPagination: { ...initialPagination },
  allSkillsPagination: { ...initialPagination },
  lastSearchParams: null,
});

export const searchSelectors = searchAdapter.getSelectors();
