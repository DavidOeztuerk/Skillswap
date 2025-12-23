using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;

namespace VideocallService.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that periodically cleans up stale video call sessions
/// - Ends sessions that have been inactive for too long
/// - Removes zombie participants (disconnected but not properly left)
/// - Updates call statistics
/// </summary>
public class CallCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CallCleanupBackgroundService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(5); // Run every 5 minutes
    private readonly TimeSpan _sessionTimeout = TimeSpan.FromHours(2); // End sessions after 2 hours of inactivity
    private readonly TimeSpan _participantTimeout = TimeSpan.FromMinutes(10); // Remove participants after 10 minutes of inactivity

    public CallCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<CallCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🧹 [CallCleanup] Background service started");

        // Wait 1 minute before first run to let application startup complete
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupStaleSessionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [CallCleanup] Error during cleanup cycle");
            }

            // Wait for next cleanup cycle
            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("🛑 [CallCleanup] Background service stopped");
    }

    private async Task CleanupStaleSessionsAsync(CancellationToken cancellationToken)
    {
        await using var scope = _serviceProvider.CreateAsyncScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IVideocallUnitOfWork>();

        _logger.LogDebug("🔍 [CallCleanup] Starting cleanup cycle");

        var now = DateTime.UtcNow;
        var sessionsToCheck = await unitOfWork.VideoCallSessions
            .GetActiveSessionsAsync(cancellationToken);

        var cleanedSessions = 0;
        var cleanedParticipants = 0;

        foreach (var session in sessionsToCheck)
        {
            try
            {
                // Check if session is stale (no activity for X hours)
                if (session.UpdatedAt.HasValue)
                {
                    var inactiveTime = now - session.UpdatedAt.Value;

                    if (inactiveTime > _sessionTimeout &&
                        (session.Status == CallStatus.Pending || session.Status == CallStatus.Active))
                    {
                        _logger.LogWarning("⏰ [CallCleanup] Session {SessionId} inactive for {Minutes} minutes, ending session",
                            session.Id, inactiveTime.TotalMinutes);

                        session.End("Automatically ended due to inactivity");
                        await unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
                        cleanedSessions++;
                        continue;
                    }
                }

                // Reload with participants for participant cleanup
                var sessionWithParticipants = await unitOfWork.VideoCallSessions
                    .GetByIdWithParticipantsAsync(session.Id, cancellationToken);

                if (sessionWithParticipants?.Participants != null)
                {
                    // Check for zombie participants
                    var participants = sessionWithParticipants.Participants.ToList();
                    foreach (var participant in participants)
                    {
                        // Skip if participant has already left
                        if (participant.LeftAt.HasValue)
                            continue;

                        // Check if participant is inactive
                        var lastActivity = participant.UpdatedAt ?? participant.CreatedAt;
                        var participantInactiveTime = now - lastActivity;

                        if (participantInactiveTime > _participantTimeout)
                        {
                            _logger.LogWarning("👻 [CallCleanup] Zombie participant {ParticipantId} in session {SessionId}, " +
                                "inactive for {Minutes} minutes, marking as left",
                                participant.Id, session.Id, participantInactiveTime.TotalMinutes);

                            participant.LeftAt = now;
                            participant.UpdatedAt = now;
                            participant.UpdatedBy = "System:CallCleanup";

                            await unitOfWork.CallParticipants.UpdateAsync(participant, cancellationToken);

                            // Remove from session's connected users
                            sessionWithParticipants.RemoveParticipant(participant.UserId);
                            await unitOfWork.VideoCallSessions.UpdateAsync(sessionWithParticipants, cancellationToken);

                            cleanedParticipants++;
                        }
                    }

                    // If no participants left and session is active, end it
                    if (sessionWithParticipants.ParticipantCount == 0 &&
                        sessionWithParticipants.Status == CallStatus.Active)
                    {
                        _logger.LogInformation("🏁 [CallCleanup] Session {SessionId} has no participants, ending session",
                            sessionWithParticipants.Id);

                        sessionWithParticipants.End("Automatically ended - no participants");
                        await unitOfWork.VideoCallSessions.UpdateAsync(sessionWithParticipants, cancellationToken);
                        cleanedSessions++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [CallCleanup] Error cleaning up session {SessionId}", session.Id);
            }
        }

        // Save all changes
        if (cleanedSessions > 0 || cleanedParticipants > 0)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("✅ [CallCleanup] Cleanup completed: {Sessions} sessions ended, " +
                "{Participants} zombie participants removed",
                cleanedSessions, cleanedParticipants);
        }
        else
        {
            _logger.LogDebug("✨ [CallCleanup] No cleanup needed - all sessions healthy");
        }
    }
}
