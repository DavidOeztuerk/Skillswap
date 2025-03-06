using Events;
using MassTransit;
using VideocallService.Models;

namespace VideocallService.Consumer;

public class AppointmentAcceptedConsumer(
    VideoCallDbContext dbContext)
    : IConsumer<AppointmentAcceptedEvent>
{
    private readonly VideoCallDbContext _dbContext = dbContext;

    public async Task Consume(ConsumeContext<AppointmentAcceptedEvent> context)
    {
        var callSession = new VideoCallSession
        {
            RoomId = context.Message.AppointmentId,
            CreatorId = context.Message.CreatorId,
            ParticipantId = context.Message.ParticipantId,
        };

        _dbContext.VideoCalls.Add(callSession);
        await _dbContext.SaveChangesAsync();
    }
}
