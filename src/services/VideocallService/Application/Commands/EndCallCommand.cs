using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

public record EndCallCommand(
    string SessionId,
    string? EndReason = null,
    int? QualityRating = null,
    string? SessionNotes = null) : ICommand<EndCallResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record EndCallResponse(
    string SessionId,
    string Status,
    DateTime EndedAt,
    int? DurationMinutes);
