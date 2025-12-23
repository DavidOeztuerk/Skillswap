using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers;

public class RegisterPushTokenCommandHandler : IRequestHandler<RegisterPushTokenCommand, ApiResponse<bool>>
{
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<RegisterPushTokenCommandHandler> _logger;

    public RegisterPushTokenCommandHandler(
        INotificationUnitOfWork unitOfWork,
        ILogger<RegisterPushTokenCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<bool>> Handle(RegisterPushTokenCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return ApiResponse<bool>.ErrorResult("Push token cannot be empty");
            }

            var preferences = await _unitOfWork.NotificationPreferences.GetByUserIdAsync(request.UserId, cancellationToken);

            if (preferences == null)
            {
                // Create new preferences with push token
                preferences = new NotificationPreferences
                {
                    UserId = request.UserId,
                    PushToken = request.Token,
                    PushEnabled = true,
                    PushReminders = true
                };
                await _unitOfWork.NotificationPreferences.CreateAsync(preferences, cancellationToken);
                _logger.LogInformation("Created notification preferences with push token for user {UserId}", request.UserId);
            }
            else
            {
                // Update existing preferences with new token
                preferences.PushToken = request.Token;
                preferences.PushEnabled = true;
                await _unitOfWork.NotificationPreferences.UpdateAsync(preferences, cancellationToken);
                _logger.LogInformation("Updated push token for user {UserId}", request.UserId);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResult(true, "Push token registered successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering push token for user {UserId}", request.UserId);
            return ApiResponse<bool>.ErrorResult("Failed to register push token");
        }
    }
}
