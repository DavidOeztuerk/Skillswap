using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

// ============================================================================
// RETRY FAILED NOTIFICATION COMMAND
// ============================================================================

public record RetryFailedNotificationCommand(
    string NotificationId,
    string? NewRecipient = null,
    Dictionary<string, string>? UpdatedVariables = null) : ICommand<RetryFailedNotificationResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record RetryFailedNotificationResponse(
    string NotificationId,
    string Status,
    int RetryCount);

public class RetryFailedNotificationCommandValidator : AbstractValidator<RetryFailedNotificationCommand>
{
    public RetryFailedNotificationCommandValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty().WithMessage("Notification ID is required");

        RuleFor(x => x.NewRecipient)
            .MaximumLength(256).WithMessage("Recipient must not exceed 256 characters")
            .When(x => !string.IsNullOrEmpty(x.NewRecipient));
    }
}
