export const Roles = {
  ADMIN: 'Admin',
  USER: 'User',
  MODERATOR: 'Moderator',
  SUPER_ADMIN: 'SuperAdmin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
