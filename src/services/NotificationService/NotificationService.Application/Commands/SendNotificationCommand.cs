using Contracts.Notification.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

public record SendNotificationCommand(
    string Type, // Email, SMS, Push
    string Template,
    string Recipient,
    Dictionary<string, string> Variables,
    string Priority = "Normal",
    DateTime? ScheduledAt = null,
    string? CorrelationId = null)
    : ICommand<SendNotificationResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class SendNotificationCommandValidator : AbstractValidator<SendNotificationCommand>
{
    public SendNotificationCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Notification type is required")
            .Must(BeValidNotificationType).WithMessage("Invalid notification type");

        RuleFor(x => x.Template)
            .NotEmpty().WithMessage("Template is required")
            .MaximumLength(100).WithMessage("Template name must not exceed 100 characters");

        RuleFor(x => x.Recipient)
            .NotEmpty().WithMessage("Recipient is required")
            .MaximumLength(256).WithMessage("Recipient must not exceed 256 characters");

        RuleFor(x => x.Priority)
            .Must(BeValidPriority).WithMessage("Invalid priority level");

        RuleFor(x => x.Variables)
            .NotNull().WithMessage("Variables cannot be null");

        When(x => x.Type == "Email", () =>
        {
            RuleFor(x => x.Recipient)
                .EmailAddress().WithMessage("Invalid email address format");
        });

        When(x => x.Type == "SMS", () =>
        {
            RuleFor(x => x.Recipient)
                .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid phone number format");
        });
    }

    private static bool BeValidNotificationType(string type)
    {
        var validTypes = new[] { "Email", "SMS", "Push", "InApp" };
        return validTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
    }

    private static bool BeValidPriority(string priority)
    {
        var validPriorities = new[] { "Low", "Normal", "High", "Urgent" };
        return validPriorities.Contains(priority, StringComparer.OrdinalIgnoreCase);
    }
}
