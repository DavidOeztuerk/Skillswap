using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record CreateDirectMatchRequestCommand(
    string TargetUserId,
    string SkillId,
    string Message,
    bool IsLearningMode)
    : ICommand<DirectMatchRequestResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "outgoing-match-requests:*",
        "incoming-match-requests:*",
        "match-statistics:*"  // Statistics include date ranges
    };
}

public record DirectMatchRequestResponse(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string Message,
    bool IsLearningMode,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    DateTime? ExpiresAt,
    string? SkillName = null,
    string? RequesterName = null,
    string? TargetUserName = null);

public class CreateDirectMatchRequestCommandValidator : AbstractValidator<CreateDirectMatchRequestCommand>
{
    public CreateDirectMatchRequestCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Requester user ID is required");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required");

        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(10, 500).WithMessage("Message must be between 10 and 500 characters");

        RuleFor(x => x.UserId)
            .Must((command, userId) => userId != command.TargetUserId)
            .WithMessage("Cannot create match request with yourself");
    }
}