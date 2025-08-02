using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles SkillDeletedDomainEvent to cascade delete all Appointments for the deleted skill
/// </summary>
public class SkillDeletedIntegrationEventHandler(
    AppointmentDbContext dbContext,
    ILogger<SkillDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing SkillDeletedEvent for skill {SkillId}", integrationEvent.SkillId);

        var deletedAppointmentsCount = 0;

        // Delete all Appointments for this skill
        var appointmentsToDelete = await _dbContext.Appointments
            .Where(a => a.SkillId == integrationEvent.SkillId)
            .ToListAsync(cancellationToken);

        if (appointmentsToDelete.Any())
        {
            _dbContext.Appointments.RemoveRange(appointmentsToDelete);
            deletedAppointmentsCount = appointmentsToDelete.Count;
            Logger.LogInformation("Marked {Count} Appointments for deletion for skill {SkillId}", 
                deletedAppointmentsCount, integrationEvent.SkillId);

            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {AppointmentsCount} Appointments for skill {SkillId}", 
                deletedAppointmentsCount, integrationEvent.SkillId);
        }
        else
        {
            Logger.LogInformation("No Appointments found for skill {SkillId}", integrationEvent.SkillId);
        }
    }
}