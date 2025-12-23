export interface EmailAvailabilityResponse {
  email: string;
  isAvailable: boolean;
  suggestion?: string;
}
