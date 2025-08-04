export interface CreateSkillRequest {
  name: string;
  description: string;
  isOffered: boolean;
  categoryId: string;
  proficiencyLevelId: string;
  tags?: string[];
  availableHours?: number;
  preferredSessionDuration?: number;
  isRemote?: boolean;
}

export interface ExtendedCreateSkillRequest extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}
