using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class GenerateReportCommand : ICommand<ReportResult>
{
    public string? Type { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = [];
}


// Request DTOs
public record UpdateUserRoleRequest(string Role);
public record SuspendUserRequest(string Reason);
public record UpdateAdminSettingsRequest
{
    public bool MaintenanceMode { get; set; }
    public string? MaintenanceMessage { get; set; }
    public bool RegistrationEnabled { get; set; }
    public int MaxUsersPerDay { get; set; }
    public int MaxSkillsPerUser { get; set; }
    public int MaxMatchesPerUser { get; set; }
    public bool EmailVerificationRequired { get; set; }
    public bool TwoFactorEnabled { get; set; }
}

public record BulkUserActionRequest(
    List<string> UserIds,
    string Action,
    string? Reason
);

public record SendBulkNotificationRequest(
    string Title,
    string Message,
    string Type,
    List<string>? TargetUsers,
    List<string>? TargetRoles
);

public record GenerateReportRequest(
    string Type,
    Dictionary<string, object> Parameters
);

// Response DTOs
public record AdminDashboardResponse
{
    public DashboardOverview? Overview { get; set; }
    public DashboardActivity? RecentActivity { get; set; }
    public List<TopCategory> TopCategories { get; set; } = [];
}

public record DashboardOverview
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalSkills { get; set; }
    public int TotalAppointments { get; set; }
    public int TotalMatches { get; set; }
    public int PendingReports { get; set; }
}

public record DashboardActivity
{
    public int NewUsers { get; set; }
    public int NewSkills { get; set; }
    public int CompletedAppointments { get; set; }
    public int ActiveMatches { get; set; }
}

public record TopCategory(string Name, int Count, double Growth);

public record AdminUserResponse
{
    public string? Id { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public List<string> Roles { get; set; } = [];
    public string? AccountStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool EmailVerified { get; set; }
    public bool TwoFactorEnabled { get; set; }
}

public record SystemHealthResponse
{
    public string? Status { get; set; }
    public SystemPerformance? Performance { get; set; }
    public List<ServiceStatus> Services { get; set; } = [];
    public List<SystemAlert> Alerts { get; set; } = [];
}

public record SystemPerformance
{
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public double DiskUsage { get; set; }
}

public record ServiceStatus(
    string Name,
    string Status,
    double Uptime,
    int ResponseTime
);

public record SystemAlert
{
    public string? Id { get; set; }
    public string? Severity { get; set; }
    public string? Message { get; set; }
    public string? Service { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Resolved { get; set; }
}

public record AuditLogResponse
{
    public string? Id { get; set; }
    public string? Action { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}

public record AdminSettingsResponse
{
    public bool MaintenanceMode { get; set; }
    public string? MaintenanceMessage { get; set; }
    public bool RegistrationEnabled { get; set; }
    public int MaxUsersPerDay { get; set; }
    public int MaxSkillsPerUser { get; set; }
    public int MaxMatchesPerUser { get; set; }
    public bool EmailVerificationRequired { get; set; }
    public bool TwoFactorEnabled { get; set; }
}

public record ExportResult(byte[] FileContent, string FileName);
public record ReportResult(byte[] FileContent, string FileName);