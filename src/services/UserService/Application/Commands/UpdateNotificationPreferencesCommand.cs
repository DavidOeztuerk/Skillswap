using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record UpdateNotificationPreferencesCommand(
    EmailNotificationSettings EmailSettings,
    PushNotificationSettings PushSettings,
    InAppNotificationSettings InAppSettings)
    : ICommand<UpdateNotificationPreferencesResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateNotificationPreferencesResponse(
    string UserId,
    EmailNotificationSettings EmailSettings,
    PushNotificationSettings PushSettings,
    InAppNotificationSettings InAppSettings,
    DateTime UpdatedAt);

public class UpdateNotificationPreferencesCommandValidator : AbstractValidator<UpdateNotificationPreferencesCommand>
{
    public UpdateNotificationPreferencesCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
        
        RuleFor(x => x.EmailSettings)
            .NotNull().WithMessage("Email settings are required");
        
        RuleFor(x => x.PushSettings)
            .NotNull().WithMessage("Push settings are required");
        
        RuleFor(x => x.InAppSettings)
            .NotNull().WithMessage("In-app settings are required");
    }
}
