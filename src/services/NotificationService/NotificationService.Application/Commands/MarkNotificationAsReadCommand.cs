using Contracts.Notification.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

public record MarkNotificationAsReadCommand(
    string NotificationId,
    string UserId) : ICommand<MarkNotificationAsReadResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "notification-history:*"
    };
}

public class MarkNotificationAsReadCommandValidator : AbstractValidator<MarkNotificationAsReadCommand>
{
    public MarkNotificationAsReadCommandValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty().WithMessage("Notification ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}