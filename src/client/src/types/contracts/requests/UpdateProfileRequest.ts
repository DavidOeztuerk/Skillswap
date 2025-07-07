export interface UpdateProfileRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  timeZone?: string;
  preferences?: Record<string, string>;
}
