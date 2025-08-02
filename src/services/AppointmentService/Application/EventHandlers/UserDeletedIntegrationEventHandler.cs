using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Appointments for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    AppointmentDbContext dbContext,
    ILogger<UserDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedAppointmentsCount = 0;

        // Delete all Appointments where user is organizer or participant
        var appointmentsToDelete = await _dbContext.Appointments
            .Where(a => a.OrganizerUserId == integrationEvent.UserId || a.ParticipantUserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (appointmentsToDelete.Any())
        {
            _dbContext.Appointments.RemoveRange(appointmentsToDelete);
            deletedAppointmentsCount = appointmentsToDelete.Count;
            Logger.LogInformation("Marked {Count} Appointments for deletion for user {UserId}",
                deletedAppointmentsCount, integrationEvent.UserId);

            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {AppointmentsCount} Appointments for user {UserId}",
                deletedAppointmentsCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No Appointments found for user {UserId}", integrationEvent.UserId);
        }
    }
}