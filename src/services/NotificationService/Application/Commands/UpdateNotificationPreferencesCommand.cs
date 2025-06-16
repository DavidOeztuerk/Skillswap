using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands;

// ============================================================================
// UPDATE NOTIFICATION PREFERENCES COMMAND
// ============================================================================

public record UpdateNotificationPreferencesCommand(
    string UserId,
    bool? EmailEnabled = null,
    bool? EmailMarketing = null,
    bool? EmailSecurity = null,
    bool? EmailUpdates = null,
    bool? SmsEnabled = null,
    bool? SmsSecurity = null,
    bool? SmsReminders = null,
    bool? PushEnabled = null,
    bool? PushMarketing = null,
    bool? PushSecurity = null,
    bool? PushUpdates = null,
    TimeOnly? QuietHoursStart = null,
    TimeOnly? QuietHoursEnd = null,
    string? TimeZone = null,
    string? DigestFrequency = null,
    string? Language = null) : ICommand<UpdateNotificationPreferencesResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateNotificationPreferencesResponse(
    string UserId,
    DateTime UpdatedAt);

public class UpdateNotificationPreferencesCommandValidator : AbstractValidator<UpdateNotificationPreferencesCommand>
{
    public UpdateNotificationPreferencesCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.TimeZone)
            .Must(BeValidTimeZone).WithMessage("Invalid timezone")
            .When(x => !string.IsNullOrEmpty(x.TimeZone));

        RuleFor(x => x.DigestFrequency)
            .Must(BeValidDigestFrequency).WithMessage("Invalid digest frequency")
            .When(x => !string.IsNullOrEmpty(x.DigestFrequency));

        RuleFor(x => x.Language)
            .Length(2, 10).WithMessage("Language must be 2-10 characters")
            .When(x => !string.IsNullOrEmpty(x.Language));
    }

    private static bool BeValidTimeZone(string? timeZone)
    {
        if (string.IsNullOrEmpty(timeZone)) return true;

        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool BeValidDigestFrequency(string? frequency)
    {
        if (string.IsNullOrEmpty(frequency)) return true;

        var validFrequencies = new[] { "Immediate", "Daily", "Weekly", "Never" };
        return validFrequencies.Contains(frequency, StringComparer.OrdinalIgnoreCase);
    }
}
