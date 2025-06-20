// ============================================================================
// UPDATE NOTIFICATION PREFERENCES COMMAND HANDLER
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.CommandHandlers;

public class UpdateNotificationPreferencesCommandHandler(
    NotificationDbContext context,
    ILogger<UpdateNotificationPreferencesCommandHandler> logger)
    : BaseCommandHandler<UpdateNotificationPreferencesCommand, UpdateNotificationPreferencesResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<UpdateNotificationPreferencesResponse>> Handle(
        UpdateNotificationPreferencesCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var preferences = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);

            if (preferences == null)
            {
                // Create new preferences with default values
                preferences = new NotificationPreferences
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = request.UserId,
                    EmailEnabled = true,
                    EmailMarketing = true,
                    EmailSecurity = true,
                    EmailUpdates = true,
                    SmsEnabled = false,
                    SmsSecurity = false,
                    SmsReminders = false,
                    PushEnabled = true,
                    PushMarketing = false,
                    PushSecurity = true,
                    PushUpdates = true,
                    TimeZone = "UTC",
                    DigestFrequency = "Daily",
                    Language = "en",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.NotificationPreferences.Add(preferences);
            }

            // Update preferences with provided values
            if (request.EmailEnabled.HasValue)
                preferences.EmailEnabled = request.EmailEnabled.Value;

            if (request.EmailMarketing.HasValue)
                preferences.EmailMarketing = request.EmailMarketing.Value;

            if (request.EmailSecurity.HasValue)
                preferences.EmailSecurity = request.EmailSecurity.Value;

            if (request.EmailUpdates.HasValue)
                preferences.EmailUpdates = request.EmailUpdates.Value;

            if (request.SmsEnabled.HasValue)
                preferences.SmsEnabled = request.SmsEnabled.Value;

            if (request.SmsSecurity.HasValue)
                preferences.SmsSecurity = request.SmsSecurity.Value;

            if (request.SmsReminders.HasValue)
                preferences.SmsReminders = request.SmsReminders.Value;

            if (request.PushEnabled.HasValue)
                preferences.PushEnabled = request.PushEnabled.Value;

            if (request.PushMarketing.HasValue)
                preferences.PushMarketing = request.PushMarketing.Value;

            if (request.PushSecurity.HasValue)
                preferences.PushSecurity = request.PushSecurity.Value;

            if (request.PushUpdates.HasValue)
                preferences.PushUpdates = request.PushUpdates.Value;

            if (request.QuietHoursStart.HasValue)
                preferences.QuietHoursStart = request.QuietHoursStart.Value;

            if (request.QuietHoursEnd.HasValue)
                preferences.QuietHoursEnd = request.QuietHoursEnd.Value;

            if (!string.IsNullOrEmpty(request.TimeZone))
                preferences.TimeZone = request.TimeZone;

            if (!string.IsNullOrEmpty(request.DigestFrequency))
                preferences.DigestFrequency = request.DigestFrequency;

            if (!string.IsNullOrEmpty(request.Language))
                preferences.Language = request.Language;

            preferences.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Notification preferences updated for user {UserId}", request.UserId);

            return Success(new UpdateNotificationPreferencesResponse(
                request.UserId,
                preferences.UpdatedAt.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating notification preferences for user {UserId}", request.UserId);
            return Error("Error updating notification preferences: " + ex.Message);
        }
    }
}
