using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to lock a chat thread (e.g., when match is dissolved or sessions are completed)
/// </summary>
public record LockChatThreadCommand(
    string ThreadId,
    string Reason) : ICommand<bool>;

public class LockChatThreadCommandValidator : AbstractValidator<LockChatThreadCommand>
{
    private static readonly string[] ValidReasons =
        ["SessionsCompleted", "MatchDissolved", "ManualLock", "UserBlocked", "Violation"];

    public LockChatThreadCommandValidator()
    {
        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lock reason is required")
            .Must(r => ValidReasons.Contains(r))
            .WithMessage($"Reason must be one of: {string.Join(", ", ValidReasons)}");
    }
}
