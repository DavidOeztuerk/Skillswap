namespace Contracts.Admin.Responses;

public record SecurityAlertStatisticsResponse
{
    public int TotalAlerts { get; init; }
    public int CriticalAlerts { get; init; }
    public int HighAlerts { get; init; }
    public int MediumAlerts { get; init; }
    public int LowAlerts { get; init; }
    public int InfoAlerts { get; init; }
    public int UnreadAlerts { get; init; }
    public int ActiveAlerts { get; init; }
    public int DismissedAlerts { get; init; }
    public DateTime? LastCriticalAlertAt { get; init; }
    public DateTime? LastAlertAt { get; init; }
    public List<AlertTypeCountResponse> AlertsByType { get; init; } = new();
    public List<AlertTimelinePointResponse> Timeline { get; init; } = new();
}

public record AlertTypeCountResponse
{
    public string Type { get; init; } = string.Empty;
    public int Count { get; init; }
    public string HighestSeverity { get; init; } = string.Empty;
}

public record AlertTimelinePointResponse
{
    public DateTime Date { get; init; }
    public int Critical { get; init; }
    public int High { get; init; }
    public int Medium { get; init; }
    public int Low { get; init; }
    public int Info { get; init; }
}
