using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers;

public class CancelAppointmentRemindersCommandHandler : IRequestHandler<CancelAppointmentRemindersCommand, ApiResponse<int>>
{
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<CancelAppointmentRemindersCommandHandler> _logger;

    public CancelAppointmentRemindersCommandHandler(
        INotificationUnitOfWork unitOfWork,
        ILogger<CancelAppointmentRemindersCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<int>> Handle(CancelAppointmentRemindersCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get pending reminders for this appointment
            var reminders = await _unitOfWork.ScheduledReminders.GetByAppointmentIdAsync(request.AppointmentId, cancellationToken);
            var pendingCount = reminders.Count(r => r.Status == "Pending");

            // Cancel all pending reminders
            await _unitOfWork.ScheduledReminders.CancelByAppointmentIdAsync(request.AppointmentId, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Cancelled {Count} reminders for appointment {AppointmentId}",
                pendingCount, request.AppointmentId);

            return ApiResponse<int>.SuccessResult(pendingCount, $"{pendingCount} reminders cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling reminders for appointment {AppointmentId}", request.AppointmentId);
            return ApiResponse<int>.ErrorResult("Failed to cancel reminders");
        }
    }
}
