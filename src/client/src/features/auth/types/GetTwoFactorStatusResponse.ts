// The actual data returned after ApiResponse unwrapping by apiClient
export interface GetTwoFactorStatusResponse {
  isEnabled: boolean;
  hasSecret: boolean;
  enabledAt?: string;
  backupCodes?: string[];
}
