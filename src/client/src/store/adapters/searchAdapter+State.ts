import { EntityState, EntityId, createEntityAdapter } from "@reduxjs/toolkit";
import { Skill } from "../../types/models/Skill";
import { RequestState } from "../../types/common/RequestState";
import { SkillSearchParams } from "../../types/contracts/responses/SkillResponses";

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


