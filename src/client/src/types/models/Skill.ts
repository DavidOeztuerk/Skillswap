export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
}

export enum SkillCategory {
  Programming = 'Programming',
  Language = 'Language',
  Music = 'Music',
  Art = 'Art',
  Science = 'Science',
  Math = 'Math',
  Business = 'Business',
  Other = 'Other',
}
