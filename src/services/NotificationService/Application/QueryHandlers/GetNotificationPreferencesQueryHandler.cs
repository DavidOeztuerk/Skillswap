using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using Core.Common.Exceptions;

namespace NotificationService.Application.QueryHandlers;

public class GetNotificationPreferencesQueryHandler(
    NotificationDbContext context,
    ILogger<GetNotificationPreferencesQueryHandler> logger)
    : BaseQueryHandler<GetNotificationPreferencesQuery, NotificationPreferencesResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<NotificationPreferencesResponse>> Handle(
        GetNotificationPreferencesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var preferences = await _context.NotificationPreferences
                .AsNoTracking() 
                .FirstOrDefaultAsync(p => p.UserId == request.UserId && !p.IsDeleted, cancellationToken);

            if (preferences == null)
            {
                // Return default preferences
                return Success(new NotificationPreferencesResponse
                {
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
                    UpdatedAt = DateTime.UtcNow
                });
            }

            return Success(new NotificationPreferencesResponse
            {
                UserId = preferences.UserId,
                EmailEnabled = preferences.EmailEnabled,
                EmailMarketing = preferences.EmailMarketing,
                EmailSecurity = preferences.EmailSecurity,
                EmailUpdates = preferences.EmailUpdates,
                SmsEnabled = preferences.SmsEnabled,
                SmsSecurity = preferences.SmsSecurity,
                SmsReminders = preferences.SmsReminders,
                PushEnabled = preferences.PushEnabled,
                PushMarketing = preferences.PushMarketing,
                PushSecurity = preferences.PushSecurity,
                PushUpdates = preferences.PushUpdates,
                QuietHoursStart = preferences.QuietHoursStart,
                QuietHoursEnd = preferences.QuietHoursEnd,
                TimeZone = preferences.TimeZone,
                DigestFrequency = preferences.DigestFrequency,
                Language = preferences.Language,
                UpdatedAt = preferences.UpdatedAt ?? DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving notification preferences for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving notification preferences: " + ex.Message, ErrorCodes.InternalError);
        }
    }
}
