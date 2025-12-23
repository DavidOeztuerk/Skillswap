using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Commands;

public record SendTestEmailCommand(
    string TemplateId,
    string RecipientEmail,
    Dictionary<string, string>? Variables = null)
    : ICommand<SendTestEmailResponse>
{
    public string? UserId { get; set; }
}

public class SendTestEmailCommandValidator : AbstractValidator<SendTestEmailCommand>
{
    public SendTestEmailCommandValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty().WithMessage("Template ID is required");

        RuleFor(x => x.RecipientEmail)
            .NotEmpty().WithMessage("Recipient email is required")
            .EmailAddress().WithMessage("Invalid email address");
    }
}
