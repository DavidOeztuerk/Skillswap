using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

// ============================================================================
// UPDATE EMAIL TEMPLATE COMMAND
// ============================================================================

public record UpdateEmailTemplateCommand(
    string TemplateId,
    string? Subject = null,
    string? HtmlContent = null,
    string? TextContent = null,
    string? Description = null,
    bool? IsActive = null,
    Dictionary<string, string>? VariablesSchema = null) : ICommand<UpdateEmailTemplateResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateEmailTemplateResponse(
    string TemplateId,
    string Name,
    DateTime UpdatedAt);

public class UpdateEmailTemplateCommandValidator : AbstractValidator<UpdateEmailTemplateCommand>
{
    public UpdateEmailTemplateCommandValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty().WithMessage("Template ID is required");

        RuleFor(x => x.Subject)
            .MaximumLength(500).WithMessage("Subject must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Subject));

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
