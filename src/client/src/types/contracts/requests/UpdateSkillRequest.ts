export interface UpdateSkillRequest {
  skillId: string;
  name?: string;
  description?: string;
  isOffering?: boolean;
  skillCategoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];
  estimatedDurationMinutes?: number;
  requirements?: string;
  location?: string;
  isRemoteAvailable?: boolean;
  isActive?: boolean;
}

export interface ExtendedUpdateSkillRequest extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}
