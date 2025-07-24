export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
  deviceId?: string;
  deviceInfo?: string;
}
