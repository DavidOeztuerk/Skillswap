export interface UserActivityResponse {
  activityId: string;
  userId: string;
  activityType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
