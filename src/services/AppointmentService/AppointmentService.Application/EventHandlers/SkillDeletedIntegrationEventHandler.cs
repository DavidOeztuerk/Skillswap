using CQRS.Handlers;
using Events.Domain.Skill;
using AppointmentService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles SkillDeletedDomainEvent to cascade delete all Appointments for the deleted skill
/// </summary>
public class SkillDeletedIntegrationEventHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<SkillDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing SkillDeletedEvent for skill {SkillId}", integrationEvent.SkillId);

        await _unitOfWork.Appointments.DeleteBySkillIdAsync(integrationEvent.SkillId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Successfully deleted Appointments for skill {SkillId}", integrationEvent.SkillId);
    }
}