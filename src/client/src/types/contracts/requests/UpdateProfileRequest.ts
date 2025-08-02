export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  timeZone?: string;
  preferences?: Record<string, string>;
}


export interface UpdateUserProfileResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userName?: string;
  phoneNumber?: string;
  bio?: string;
  timeZone?: string;
  updatedAt: Date
}