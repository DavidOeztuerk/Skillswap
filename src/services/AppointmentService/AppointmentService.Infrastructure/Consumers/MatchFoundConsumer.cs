using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure.Data;
using Events.Integration.Communication;
using MassTransit;

namespace AppointmentService.Consumer;

public class MatchFoundConsumer(
    AppointmentDbContext dbContext)
    : IConsumer<MatchFoundEvent>
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public async Task Consume(ConsumeContext<MatchFoundEvent> context)
    {
        var appointment = new Appointment
        {
            Title = "Skill Swap: " + context.Message.SkillName,
            Description = "Automatisch erstellter Termin für den Skill-Tausch",
            ScheduledDate = DateTime.UtcNow.AddDays(3),
            CreatedBy = context.Message.SkillSearcherId,
            ParticipantUserId = context.Message.SkillCreatorId,
            Status = "Pending"
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync();
    }
}