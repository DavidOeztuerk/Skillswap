namespace Contracts.Admin.Requests;

public record DismissSecurityAlertRequest
{
    public string AlertId { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}
