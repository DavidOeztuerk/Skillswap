using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Matchmaking;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles MatchDeletedDomainEvent to cascade delete all Appointments for the deleted match
/// </summary>
public class MatchDeletedIntegrationEventHandler(
    AppointmentDbContext dbContext,
    ILogger<MatchDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<MatchDeletedDomainEvent>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(MatchDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing MatchDeletedEvent for match {MatchId}", integrationEvent.MatchId);

        var deletedAppointmentsCount = 0;

        // Delete all Appointments for this match
        var appointmentsToDelete = await _dbContext.Appointments
            .Where(a => a.MatchId == integrationEvent.MatchId)
            .ToListAsync(cancellationToken);

        if (appointmentsToDelete.Any())
        {
            _dbContext.Appointments.RemoveRange(appointmentsToDelete);
            deletedAppointmentsCount = appointmentsToDelete.Count;
            Logger.LogInformation("Marked {Count} Appointments for deletion for match {MatchId}", 
                deletedAppointmentsCount, integrationEvent.MatchId);

            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {AppointmentsCount} Appointments for match {MatchId}", 
                deletedAppointmentsCount, integrationEvent.MatchId);
        }
        else
        {
            Logger.LogInformation("No Appointments found for match {MatchId}", integrationEvent.MatchId);
        }
    }
}