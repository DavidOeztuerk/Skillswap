using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Queries;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.QueryHandlers;

public class GetReminderSettingsQueryHandler : IRequestHandler<GetReminderSettingsQuery, ApiResponse<ReminderSettingsResponse>>
{
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<GetReminderSettingsQueryHandler> _logger;

    public GetReminderSettingsQueryHandler(
        INotificationUnitOfWork unitOfWork,
        ILogger<GetReminderSettingsQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<ReminderSettingsResponse>> Handle(GetReminderSettingsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _unitOfWork.ReminderSettings.GetByUserIdAsync(request.UserId, cancellationToken);

            // If no settings exist, return default settings
            if (settings == null)
            {
                var defaultSettings = new ReminderSettingsResponse
                {
                    Id = string.Empty,
                    UserId = request.UserId,
                    ReminderMinutesBefore = new[] { 15, 60 }, // Default: 15min, 1h
                    EmailRemindersEnabled = true,
                    PushRemindersEnabled = true,
                    SmsRemindersEnabled = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                return ApiResponse<ReminderSettingsResponse>.SuccessResult(defaultSettings, "Default reminder settings");
            }

            var response = new ReminderSettingsResponse
            {
                Id = settings.Id!,
                UserId = settings.UserId,
                ReminderMinutesBefore = settings.GetReminderMinutes(),
                EmailRemindersEnabled = settings.EmailRemindersEnabled,
                PushRemindersEnabled = settings.PushRemindersEnabled,
                SmsRemindersEnabled = settings.SmsRemindersEnabled,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };

            return ApiResponse<ReminderSettingsResponse>.SuccessResult(response, "Reminder settings retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reminder settings for user {UserId}", request.UserId);
            return ApiResponse<ReminderSettingsResponse>.ErrorResult("Failed to retrieve reminder settings");
        }
    }
}
