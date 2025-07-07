export interface UserSearchResultResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  emailVerified: boolean;
  accountStatus: string;
  createdAt: string;
  lastLoginAt?: string;
}
