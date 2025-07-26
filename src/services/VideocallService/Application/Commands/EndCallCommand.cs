using Contracts.VideoCall.Responses;
using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

public record EndCallCommand(
    string SessionId,
    // string? EndReason = null,
    // int? QualityRating = null,
    // string? SessionNotes = null
    int DurationSeconds,
    int? Rating = null,
    string? Feedback = null) 
    : ICommand<EndCallResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
