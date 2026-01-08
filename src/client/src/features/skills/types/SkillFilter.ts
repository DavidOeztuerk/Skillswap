/**
 * Complete filter options for skill search
 */
export interface SkillFilters {
  searchTerm?: string;
  categoryId?: string;
  isOffered?: boolean;
  minRating?: number;
  locationType?: 'remote' | 'in_person' | 'both';
  maxDistanceKm?: number;
  // Experience filters (Phase 5)
  minExperienceYears?: number;
  maxExperienceYears?: number;
  sortBy?: 'relevance' | 'rating' | 'createdAt' | 'name' | 'popularity';
  sortDirection?: 'asc' | 'desc';
  // Filter by specific user
  userId?: string;
}

export const DEFAULT_SKILL_FILTERS: SkillFilters = {
  sortBy: 'relevance',
  sortDirection: 'desc',
};

export const DISTANCE_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevanz' },
  { value: 'rating', label: 'Bewertung' },
  { value: 'createdAt', label: 'Neueste' },
  { value: 'name', label: 'Name' },
  { value: 'popularity', label: 'Beliebtheit' },
] as const;

// Experience filter options (Phase 5)
export const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Keine Erfahrung' },
  { value: 1, label: '1+ Jahr' },
  { value: 2, label: '2+ Jahre' },
  { value: 3, label: '3+ Jahre' },
  { value: 5, label: '5+ Jahre' },
  { value: 10, label: '10+ Jahre' },
] as const;
