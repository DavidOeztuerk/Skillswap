using CQRS.Handlers;
using Events.Integration.UserManagement;
using AppointmentService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Appointments for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<UserDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        await _unitOfWork.Appointments.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Successfully deleted Appointments for user {UserId}", integrationEvent.UserId);
    }
}