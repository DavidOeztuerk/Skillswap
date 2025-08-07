export interface GenerateTwoFactorSecretResponse {
  secret: string;
  qrCodeUri: string;
  manualEntryKey: string;
}
