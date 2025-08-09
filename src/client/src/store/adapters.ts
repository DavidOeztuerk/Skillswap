// import { createEntityAdapter, EntityState, EntityId } from '@reduxjs/toolkit';
// import { ProficiencyLevel, Skill, SkillCategory } from '../types/models/Skill';
// import { Appointment } from '../types/models/Appointment';
// import { Match } from '../types/models/Match';
// import { Notification } from '../types/models/Notification';
// import { User } from '../types/models/User';

// /**
//  * Entity adapters for normalized state management
//  * Provides standardized CRUD operations for collections
//  */

// // Skills Entity Adapter
// export const skillsAdapter = createEntityAdapter<Skill>({
//   sortComparer: (a, b) => a.name.localeCompare(b.name),
// });

// export interface SkillsEntityState extends EntityState<Skill, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   selectedSkillId: string | null;
//   searchTerm: string;
//   filters: {
//     categoryId?: string;
//     proficiencyLevel?: number;
//     isActive?: boolean;
//   };
// }

// // Categories Entity Adapter
// export const categoriesAdapter = createEntityAdapter<SkillCategory>({
//   sortComparer: (a, b) => a.name.localeCompare(b.name),
// });

// export interface CategoriesEntityState extends EntityState<SkillCategory, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   selectedCategoryId: string | null;
// }

// // ProficienyLevel Entity Adapter
// export const proficiencyLevelAdapter = createEntityAdapter<ProficiencyLevel>({
//   sortComparer: (a, b) => a.level.localeCompare(b.level),
// });

// export interface ProficiencyLevelEntityState extends EntityState<ProficiencyLevel, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   selectedProficienyLevelId: string | null;
// }

// // Appointments Entity Adapter
// export const appointmentsAdapter = createEntityAdapter<Appointment>({
//   sortComparer: (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
// });

// export interface AppointmentsEntityState extends EntityState<Appointment, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   activeAppointmentId: string | null;
//   filters: {
//     status?: string;
//     dateRange?: {
//       start: string;
//       end: string;
//     };
//   };
// }

// // Matches Entity Adapter
// export const matchesAdapter = createEntityAdapter<Match>({
//   sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
// });

// export interface MatchesEntityState extends EntityState<Match, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   activeMatchId: string | null;
//   filters: {
//     status?: string;
//     skillId?: string;
//   };
// }

// // Notifications Entity Adapter
// export const notificationsAdapter = createEntityAdapter<Notification>({
//   sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
// });

// export interface NotificationsEntityState extends EntityState<Notification, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   unreadCount: number;
//   filters: {
//     isRead?: boolean;
//     type?: string;
//   };
// }

// // Users Entity Adapter (for search results, etc.)
// export const usersAdapter = createEntityAdapter<User>({
//   sortComparer: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
// });

// export interface UsersEntityState extends EntityState<User, EntityId> {
//   isLoading: boolean;
//   error: string | null;
//   searchTerm: string;
//   pagination: {
//     pageNumber: number;
//     pageSize: number;
//     totalItems: number;
//     totalPages: number;
//   };
// }

// /**
//  * Selector factories for entity adapters
//  */

// // Skills selectors
// export const skillsSelectors = skillsAdapter.getSelectors();

// // Categories selectors
// export const categoriesSelectors = categoriesAdapter.getSelectors();

// // Appointments selectors
// export const appointmentsSelectors = appointmentsAdapter.getSelectors();

// // Matches selectors
// export const matchesSelectors = matchesAdapter.getSelectors();

// // Notifications selectors
// export const notificationsSelectors = notificationsAdapter.getSelectors();

// // Users selectors
// export const usersSelectors = usersAdapter.getSelectors();

// /**
//  * Helper functions for entity operations
//  */

// // Generic function to update entity by ID
// export const updateEntityById = <T extends { id: string }>(
//   adapter: ReturnType<typeof createEntityAdapter<T>>,
//   state: EntityState<T, string>,
//   id: string,
//   changes: Partial<T>
// ) => {
//   adapter.updateOne(state, { id, changes });
// };

// // Generic function to toggle entity selection
// export const toggleEntitySelection = (
//   currentSelectedId: string | null,
//   entityId: string
// ): string | null => {
//   return currentSelectedId === entityId ? null : entityId;
// };

// // Generic function to filter entities
// export const filterEntities = <T extends Record<string, unknown>>(
//   entities: T[],
//   filters: Record<string, unknown>
// ): T[] => {
//   return entities.filter(entity => {
//     return Object.entries(filters).every(([key, value]) => {
//       if (value === undefined || value === null) return true;
      
//       const entityValue = entity[key];
      
//       if (typeof value === 'string' && typeof entityValue === 'string') {
//         return entityValue.toLowerCase()?.includes(value.toLowerCase());
//       }
      
//       return entityValue === value;
//     });
//   });
// };

// /**
//  * Initial states for entity adapters
//  */

// export const initialSkillsState: SkillsEntityState = skillsAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   selectedSkillId: null,
//   searchTerm: '',
//   filters: {
//     categoryId: undefined,
//     proficiencyLevel: undefined,
//     isActive: undefined,
//   },
// });

// export const initialCategoriesState: CategoriesEntityState = categoriesAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   selectedCategoryId: null,
// });

// export const initialProficienyLevelState: ProficiencyLevelEntityState = proficiencyLevelAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   selectedProficienyLevelId: null,
// });

// export const initialAppointmentsState: AppointmentsEntityState = appointmentsAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   activeAppointmentId: null,
//   filters: {},
// });

// export const initialMatchesState: MatchesEntityState = matchesAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   activeMatchId: null,
//   filters: {},
// });

// export const initialNotificationsState: NotificationsEntityState = notificationsAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   unreadCount: 0,
//   filters: {},
// });

// export const initialUsersState: UsersEntityState = usersAdapter.getInitialState({
//   isLoading: false,
//   error: null,
//   searchTerm: '',
//   pagination: {
//     pageNumber: 1,
//     pageSize: 20,
//     totalItems: 0,
//     totalPages: 0,
//   },
// });