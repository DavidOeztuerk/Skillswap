export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName?: string;
  phoneNumber?: string;
  bio?: string;
  timeZone?: string;
  roles?: string[];
  permissions?: string[];
  favoriteSkills: string[];
  emailVerified?: boolean;
  accountStatus?: string;
  createdAt?: string;
  lastLoginAt?: string;
  preferences?: Record<string, string>;
  profilePictureUrl?: string;
  twoFactorRequired?: boolean;
  twoFactorEnabled?: boolean;
}
