export interface CreateSkillRequest {
  name: string;
  description: string;
  isOffered: boolean;
  categoryId: string;
  proficiencyLevelId: string;
  tags?: string[];
  availableHours?: number;
  preferredSessionDuration?: number;
  location?: string;
  isRemote?: boolean;
}

export interface ExtendedCreateSkillRequest extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}
