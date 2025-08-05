using Contracts.Notification.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

public record CancelNotificationCommand(
    string NotificationId,
    string Reason) 
    : ICommand<CancelNotificationResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class CancelNotificationCommandValidator : AbstractValidator<CancelNotificationCommand>
{
    public CancelNotificationCommandValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty().WithMessage("Notification ID is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}
