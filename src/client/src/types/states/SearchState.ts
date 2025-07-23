import { SkillSearchParams } from "../../api/services/skillsService";
import { RequestState } from "../common/RequestState";
import { Skill } from "../models/Skill";

export interface SearchState extends RequestState {
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