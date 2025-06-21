using Events;
using MassTransit;
using VideocallService.Domain.Entities;

namespace VideocallService.Consumer;

public class AppointmentAcceptedConsumer(
    VideoCallDbContext dbContext,
    ILogger<AppointmentAcceptedConsumer> logger)
    : IConsumer<AppointmentAcceptedEvent>
{
    private readonly VideoCallDbContext _dbContext = dbContext;
    private readonly ILogger<AppointmentAcceptedConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<AppointmentAcceptedEvent> context)
    {
        try
        {
            var roomId = Guid.NewGuid().ToString("N")[..12];

            var callSession = new VideoCallSession
            {
                RoomId = roomId,
                InitiatorUserId = context.Message.CreatorId,
                ParticipantUserId = context.Message.ParticipantId,
                AppointmentId = context.Message.AppointmentId,
                CreatedBy = "system"
            };

            _dbContext.VideoCallSessions.Add(callSession);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Created video call session {SessionId} for appointment {AppointmentId}",
                callSession.Id, context.Message.AppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating video call session for appointment {AppointmentId}",
                context.Message.AppointmentId);
            throw;
        }
    }
}
