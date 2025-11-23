using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-matches:*",
        "outgoing-match-requests:*",  // Fix: Matches GetOutgoingMatchRequestsQuery cache keys
        "incoming-match-requests:*",  // Fix: Matches GetIncomingMatchRequestsQuery cache keys
        "accepted-match-requests:*",
        "match-statistics:*"
    };
}

public class AcceptMatchRequestCommandValidator : AbstractValidator<AcceptMatchRequestCommand>
{
    public AcceptMatchRequestCommandValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("Request ID is required");

        RuleFor(x => x.ResponseMessage)
            .MaximumLength(500).WithMessage("Response message cannot exceed 500 characters");
    }
}
