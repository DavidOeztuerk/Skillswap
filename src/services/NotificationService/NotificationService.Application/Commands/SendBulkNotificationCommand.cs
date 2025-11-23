using Contracts.Notification.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

public record SendBulkNotificationCommand(
    List<string> UserIds,
    string Type,
    string Template,
    Dictionary<string, string> GlobalVariables,
    Dictionary<string, Dictionary<string, string>>? UserSpecificVariables = null,
    string Priority = "Normal",
    DateTime? ScheduledAt = null) 
    : ICommand<SendBulkNotificationResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class SendBulkNotificationCommandValidator : AbstractValidator<SendBulkNotificationCommand>
{
    public SendBulkNotificationCommandValidator()
    {
        RuleFor(x => x.UserIds)
            .NotEmpty().WithMessage("User IDs are required")
            .Must(x => x.Count <= 1000).WithMessage("Cannot send to more than 1000 users at once");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Notification type is required");

        RuleFor(x => x.Template)
            .NotEmpty().WithMessage("Template is required");

        RuleFor(x => x.GlobalVariables)
            .NotNull().WithMessage("Global variables cannot be null");
    }
}