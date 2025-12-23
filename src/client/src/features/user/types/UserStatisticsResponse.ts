export interface UserStatisticsResponse {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByAccountStatus: Record<string, number>;
  registrationTrend: DailyUserRegistration[];
}

export interface DailyUserRegistration {
  date: string;
  count: number;
}
