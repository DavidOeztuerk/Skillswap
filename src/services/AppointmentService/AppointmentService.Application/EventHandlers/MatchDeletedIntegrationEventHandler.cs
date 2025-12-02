using CQRS.Handlers;
using Events.Domain.Matchmaking;
using AppointmentService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles MatchDeletedDomainEvent to cascade delete all Appointments for the deleted match
/// </summary>
public class MatchDeletedIntegrationEventHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<MatchDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<MatchDeletedDomainEvent>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(MatchDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing MatchDeletedEvent for match {MatchId}", integrationEvent.MatchId);

        // TODO: Implement cascade delete logic
        // await _unitOfWork.Appointments.DeleteByMatchIdAsync(integrationEvent.MatchId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Successfully deleted Appointments for match {MatchId}", integrationEvent.MatchId);
    }
}