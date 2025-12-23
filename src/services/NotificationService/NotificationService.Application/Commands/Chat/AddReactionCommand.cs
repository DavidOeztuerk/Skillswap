using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to add or remove a reaction to a message
/// </summary>
public record AddReactionCommand(
    string UserId,
    string MessageId,
    string Emoji,
    bool Remove = false) : ICommand<bool>;

public class AddReactionCommandValidator : AbstractValidator<AddReactionCommand>
{
    public AddReactionCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.MessageId)
            .NotEmpty().WithMessage("Message ID is required");

        RuleFor(x => x.Emoji)
            .NotEmpty().WithMessage("Emoji is required")
            .MaximumLength(50).WithMessage("Emoji must not exceed 50 characters");
    }
}
