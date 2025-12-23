using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.CommandHandlers;

public class UpdateReminderSettingsCommandHandler : IRequestHandler<UpdateReminderSettingsCommand, ApiResponse<ReminderSettingsResponse>>
{
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateReminderSettingsCommandHandler> _logger;

    public UpdateReminderSettingsCommandHandler(
        INotificationUnitOfWork unitOfWork,
        ILogger<UpdateReminderSettingsCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<ReminderSettingsResponse>> Handle(UpdateReminderSettingsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _unitOfWork.ReminderSettings.GetByUserIdAsync(request.UserId, cancellationToken);

            if (settings == null)
            {
                // Create new settings
                settings = new ReminderSettings
                {
                    UserId = request.UserId,
                    EmailRemindersEnabled = request.EmailRemindersEnabled,
                    PushRemindersEnabled = request.PushRemindersEnabled,
                    SmsRemindersEnabled = request.SmsRemindersEnabled
                };
                settings.SetReminderMinutes(request.ReminderMinutesBefore);

                await _unitOfWork.ReminderSettings.CreateAsync(settings, cancellationToken);
                _logger.LogInformation("Created reminder settings for user {UserId}", request.UserId);
            }
            else
            {
                // Update existing settings
                settings.SetReminderMinutes(request.ReminderMinutesBefore);
                settings.EmailRemindersEnabled = request.EmailRemindersEnabled;
                settings.PushRemindersEnabled = request.PushRemindersEnabled;
                settings.SmsRemindersEnabled = request.SmsRemindersEnabled;

                await _unitOfWork.ReminderSettings.UpdateAsync(settings, cancellationToken);
                _logger.LogInformation("Updated reminder settings for user {UserId}", request.UserId);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

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

            return ApiResponse<ReminderSettingsResponse>.SuccessResult(response, "Reminder settings updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating reminder settings for user {UserId}", request.UserId);
            return ApiResponse<ReminderSettingsResponse>.ErrorResult("Failed to update reminder settings");
        }
    }
}
