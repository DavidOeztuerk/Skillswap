using Contracts.Notification.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

public record CreateEmailTemplateCommand(
    string Name,
    string Language,
    string Subject,
    string HtmlContent,
    string TextContent,
    string? Description = null,
    Dictionary<string, string>? VariablesSchema = null) 
    : ICommand<CreateEmailTemplateResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class CreateEmailTemplateCommandValidator : AbstractValidator<CreateEmailTemplateCommand>
{
    public CreateEmailTemplateCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Template name is required")
            .MaximumLength(100).WithMessage("Template name must not exceed 100 characters")
            .Matches(@"^[a-z0-9-_]+$").WithMessage("Template name can only contain lowercase letters, numbers, hyphens, and underscores");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required")
            .Length(2, 10).WithMessage("Language must be 2-10 characters");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required")
            .MaximumLength(500).WithMessage("Subject must not exceed 500 characters");

        RuleFor(x => x.HtmlContent)
            .NotEmpty().WithMessage("HTML content is required");

        RuleFor(x => x.TextContent)
            .NotEmpty().WithMessage("Text content is required");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
