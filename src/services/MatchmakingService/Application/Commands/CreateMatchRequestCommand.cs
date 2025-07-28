using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record CreateMatchRequestCommand(
    string SkillId,
    string Description,
    string Message)
    : ICommand<MatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record MatchRequestResponse(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string Description,
    string Message,
    // bool IsLearningMode,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    DateTime? ExpiresAt);

// public record DirectMatchRequestResponse(
//     string RequestId,
//     string RequesterId,
//     // string TargetUserId,
//     string SkillId,
//     string Message,
//     bool IsLearningMode,
//     string Status,
//     DateTime CreatedAt,
//     DateTime? RespondedAt,
//     DateTime? ExpiresAt);

public class CreateMatchRequestCommandValidator : AbstractValidator<CreateMatchRequestCommand>
{
    public CreateMatchRequestCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Requester user ID is required");

        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(10, 500).WithMessage("Message must be between 10 and 500 characters");

        // RuleFor(x => x.UserId)
        //     .Must((command, userId) => userId != command.UserId)
        //     .WithMessage("Cannot create match request with yourself");
    }
}
