export interface UserInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  roles: string[];
  favoriteSkills: string[];
  emailVerified: boolean;
  accountStatus: string;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissionNames: string[];
  permissionsByCategory: Record<string, string[]>;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: number;
  expiresAt: Date;
  userInfo: UserInfo;
  emailVerificationRequired: boolean;
  permissions?: UserPermissions;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: number;
  expiresAt: Date;
  userInfo: UserInfo;
  requires2FA: boolean;
  twoFactorToken: string;
  permissions?: UserPermissions;
}

export enum TokenType {

}

// export interface LoginResponse {
//   accessToken: string;
//   refreshToken: string;
//   tokenType: string;
//   expiresIn: number;
//   expiresAt: Date;
//   user: UserInfo;
//   requiresTwoFactor?: boolean;
//   twoFactorMethod?: string;
// }

// export interface UserInfo {
//   userId: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   userName: string;
//   roles: string[];
//   emailVerified: boolean;
//   accountStatus: string;
// }

// export interface LoginResponse {
//   token: string;
//   refreshToken: string;
// }

// Legacy interface - kept for backwards compatibility
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  expiresIn: number;
}
