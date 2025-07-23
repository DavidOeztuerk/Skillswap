using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

// ============================================================================
// MARK ALL NOTIFICATIONS AS READ COMMAND
// ============================================================================

public record MarkAllNotificationsAsReadCommand(
    string UserId) : ICommand<MarkAllNotificationsAsReadResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record MarkAllNotificationsAsReadResponse(
    string UserId,
    int NotificationsMarked,
    DateTime ReadAt);

public class MarkAllNotificationsAsReadCommandValidator : AbstractValidator<MarkAllNotificationsAsReadCommand>
{
    public MarkAllNotificationsAsReadCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}