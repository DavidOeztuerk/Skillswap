/**
 * Admin filter interfaces for useAdmin hook
 * These replace 'any' types to ensure type safety
 * Index signature added to support Record<string, ...> compatibility
 */

export interface UserFilters {
  role?: string;
  status?: string;
  searchTerm?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  isVerified?: boolean;
  isActive?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface SkillFilters {
  categoryId?: string;
  proficiencyLevelId?: string;
  isOffered?: boolean;
  minRating?: number;
  status?: string;
  searchTerm?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AppointmentFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  participantUserId?: string;
  meetingType?: string;
  includePast?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface MatchFilters {
  status?: string;
  userId?: string;
  skillId?: string;
  minCompatibilityScore?: number;
  fromDate?: string;
  toDate?: string;
  isActive?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  ipAddress?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ModerationReportFilters {
  status?: string;
  reportType?: string;
  reporterId?: string;
  reportedUserId?: string;
  reportedContentId?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  isResolved?: boolean;
  [key: string]: string | number | boolean | undefined;
}
