using FluentValidation;
using VideocallService.Application.Commands;

namespace VideocallService.Application.Validators;

public class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required");

        RuleFor(x => x.SenderId)
            .NotEmpty().WithMessage("Sender ID is required")
            .MaximumLength(450).WithMessage("Sender ID must not exceed 450 characters");

        RuleFor(x => x.SenderName)
            .NotEmpty().WithMessage("Sender name is required")
            .MaximumLength(200).WithMessage("Sender name must not exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .MaximumLength(2000).WithMessage("Message must not exceed 2000 characters");

        RuleFor(x => x.MessageType)
            .NotEmpty().WithMessage("Message type is required")
            .MaximumLength(50).WithMessage("Message type must not exceed 50 characters");

        RuleFor(x => x.Metadata)
            .MaximumLength(1000).WithMessage("Metadata must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Metadata));
    }
}
