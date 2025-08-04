export interface UpdateSkillRequest {
  skillId: string;
  name?: string;
  description?: string;
  isOffered?: boolean;
  categoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];
  estimatedDurationMinutes?: number;
  requirements?: string;
  isRemoteAvailable?: boolean;
  isActive?: boolean;
}

export interface ExtendedUpdateSkillRequest extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}
