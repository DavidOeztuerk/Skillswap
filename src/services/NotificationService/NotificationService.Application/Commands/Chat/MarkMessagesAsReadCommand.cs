using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to mark messages as read
/// </summary>
public record MarkMessagesAsReadCommand(
    string UserId,
    string ThreadId,
    DateTime? BeforeTimestamp = null,
    string? MessageId = null) : ICommand<bool>;

public class MarkMessagesAsReadCommandValidator : AbstractValidator<MarkMessagesAsReadCommand>
{
    public MarkMessagesAsReadCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");
    }
}
