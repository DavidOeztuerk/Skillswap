using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to update typing indicator
/// </summary>
public record UpdateTypingIndicatorCommand(
    string UserId,
    string ThreadId,
    bool IsTyping) : ICommand<bool>;

public class UpdateTypingIndicatorCommandValidator : AbstractValidator<UpdateTypingIndicatorCommand>
{
    public UpdateTypingIndicatorCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");
    }
}
