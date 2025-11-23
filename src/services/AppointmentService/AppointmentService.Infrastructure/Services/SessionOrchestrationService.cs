using AppointmentService.Application.Services;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.StateMachines;
using AppointmentService.Infrastructure.Data;
using Core.Common.Exceptions;
using EventSourcing;
using Events.Domain.Appointment;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.Services;

/// <summary>
/// Orchestrates the creation and management of the session hierarchy:
/// Connection → SessionSeries → SessionAppointments
/// </summary>
public class SessionOrchestrationService : ISessionOrchestrationService
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IMeetingLinkService _meetingLinkService;
    private readonly IAppointmentSchedulingAlgorithm _schedulingAlgorithm;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly ILogger<SessionOrchestrationService> _logger;

    public SessionOrchestrationService(
        AppointmentDbContext dbContext,
        IMeetingLinkService meetingLinkService,
        IAppointmentSchedulingAlgorithm schedulingAlgorithm,
        IDomainEventPublisher eventPublisher,
        ILogger<SessionOrchestrationService> logger)
    {
        _dbContext = dbContext;
        _meetingLinkService = meetingLinkService;
        _schedulingAlgorithm = schedulingAlgorithm;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task<Connection> CreateSessionHierarchyFromMatchAsync(
        string matchRequestId,
        string requesterId,
        string targetUserId,
        string skillId,
        bool isSkillExchange,
        string? exchangeSkillId,
        bool isMonetary,
        decimal? offeredAmount,
        string? currency,
        int totalSessions,
        int sessionDurationMinutes,
        string[] preferredDays,
        string[] preferredTimes,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Creating session hierarchy from match. MatchRequestId: {MatchRequestId}, Requester: {RequesterId}, Target: {TargetUserId}, TotalSessions: {TotalSessions}",
            matchRequestId, requesterId, targetUserId, totalSessions);

        // Use EF Core Execution Strategy to handle transactions with retry policy
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            try
            {

            // 1. Create Connection
            var connectionType = isSkillExchange ? ConnectionType.SkillExchange :
                                isMonetary ? ConnectionType.Payment :
                                ConnectionType.Free;

            var connection = Connection.Create(
                matchRequestId: matchRequestId,
                requesterId: requesterId,
                targetUserId: targetUserId,
                connectionType: connectionType,
                skillId: skillId,
                exchangeSkillId: exchangeSkillId,
                paymentRatePerHour: offeredAmount,
                currency: currency
            );

            await _dbContext.Connections.AddAsync(connection, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Connection created: {ConnectionId}", connection.Id);

            // 2. Create SessionSeries based on connection type
            if (isSkillExchange && !string.IsNullOrWhiteSpace(exchangeSkillId))
            {
                // For skill exchange: Create TWO series (one for each skill)
                var halfSessions = totalSessions / 2;
                var remainder = totalSessions % 2;

                // Series 1: Requester teaches primary skill to Target
                var series1 = await CreateSessionSeriesInternalAsync(
                    connection.Id,
                    $"Learning {skillId}", // Will be enriched with actual skill name later
                    teacherUserId: requesterId,
                    learnerUserId: targetUserId,
                    skillId: skillId,
                    totalSessions: halfSessions + remainder, // Give remainder to first series
                    defaultDurationMinutes: sessionDurationMinutes,
                    description: $"Session series for learning {skillId}",
                    cancellationToken);

                // Series 2: Target teaches exchange skill to Requester
                var series2 = await CreateSessionSeriesInternalAsync(
                    connection.Id,
                    $"Learning {exchangeSkillId}", // Will be enriched with actual skill name later
                    teacherUserId: targetUserId,
                    learnerUserId: requesterId,
                    skillId: exchangeSkillId,
                    totalSessions: halfSessions,
                    defaultDurationMinutes: sessionDurationMinutes,
                    description: $"Session series for learning {exchangeSkillId}",
                    cancellationToken);

                connection.TotalSessionsPlanned = totalSessions;
            }
            else
            {
                // For payment or free: Create ONE series
                var teacherUserId = requesterId; // Requester teaches by default (or can be configured)
                var learnerUserId = targetUserId;

                var series = await CreateSessionSeriesInternalAsync(
                    connection.Id,
                    $"Learning {skillId}",
                    teacherUserId: teacherUserId,
                    learnerUserId: learnerUserId,
                    skillId: skillId,
                    totalSessions: totalSessions,
                    defaultDurationMinutes: sessionDurationMinutes,
                    description: $"Session series for learning {skillId}",
                    cancellationToken);

                connection.TotalSessionsPlanned = totalSessions;
            }

            // 3. Generate and create appointment slots based on preferences
            _logger.LogInformation("Generating appointment slots using preferences. Days: {Days}, Times: {Times}",
                string.Join(", ", preferredDays), string.Join(", ", preferredTimes));

            var schedulingRequest = new SchedulingRequest
            {
                RequesterId = requesterId,
                TargetUserId = targetUserId,
                PreferredDays = preferredDays,
                PreferredTimes = preferredTimes,
                TotalSessions = totalSessions,
                SessionDurationMinutes = sessionDurationMinutes,
                IsSkillExchange = isSkillExchange,
                EarliestStartDate = DateTime.UtcNow.AddDays(7), // Start scheduling from next week
                MinimumDaysBetweenSessions = 1,
                MaximumDaysBetweenSessions = 14,
                DistributeEvenly = true
            };

            var proposedAppointments = await _schedulingAlgorithm.GenerateAppointmentSlotsAsync(
                schedulingRequest,
                cancellationToken);

            _logger.LogInformation("Generated {Count} appointment slots", proposedAppointments.Count);

            // 4. Create SessionAppointments from proposed slots
            if (proposedAppointments.Count > 0)
            {
                // Get all session series for this connection
                var allSeries = await _dbContext.SessionSeries
                    .Where(s => s.ConnectionId == connection.Id)
                    .ToListAsync(cancellationToken);

                foreach (var proposed in proposedAppointments)
                {
                    // For skill exchange, alternate between series
                    // For single series, always use the first one
                    SessionSeries targetSeries;
                    if (isSkillExchange && allSeries.Count == 2)
                    {
                        // Odd sessions go to first series, even to second
                        targetSeries = proposed.SessionNumber % 2 == 1 ? allSeries[0] : allSeries[1];
                    }
                    else
                    {
                        targetSeries = allSeries[0];
                    }

                    var appointment = SessionAppointment.Create(
                        sessionSeriesId: targetSeries.Id,
                        title: $"Session {proposed.SessionNumber}: {targetSeries.Title}",
                        scheduledDate: proposed.ScheduledDate,
                        durationMinutes: proposed.DurationMinutes,
                        sessionNumber: proposed.SessionNumber,
                        organizerUserId: proposed.OrganizerUserId,
                        participantUserId: proposed.ParticipantUserId,
                        description: proposed.Notes
                    );

                    await _dbContext.SessionAppointments.AddAsync(appointment, cancellationToken);

                    // Try to generate meeting link
                    try
                    {
                        var meetingLink = await _meetingLinkService.GenerateMeetingLinkAsync(
                            appointment.Id,
                            cancellationToken);
                        appointment.UpdateMeetingLink(meetingLink);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Failed to generate meeting link for appointment {AppointmentId}, will retry later",
                            appointment.Id);
                    }

                    _logger.LogDebug(
                        "Created appointment {AppointmentId} for session {SessionNumber} at {ScheduledDate}",
                        appointment.Id, proposed.SessionNumber, proposed.ScheduledDate);
                }
            }
            else
            {
                _logger.LogWarning(
                    "No appointment slots could be generated for the given preferences. Connection created but appointments not scheduled.");
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            // 5. Publish Domain Event
            await _eventPublisher.Publish(new ConnectionCreatedEvent(
                connection.Id,
                connection.RequesterId,
                connection.TargetUserId,
                connection.ConnectionType,
                connection.SkillId,
                connection.TotalSessionsPlanned
            ), cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation(
                    "Session hierarchy created successfully. ConnectionId: {ConnectionId}, TotalSessions: {TotalSessions}",
                    connection.Id, connection.TotalSessionsPlanned);

                // Reload connection with all related data for notification purposes
                var connectionWithData = await _dbContext.Connections
                    .Include(c => c.SessionSeries)
                        .ThenInclude(s => s.SessionAppointments)
                    .FirstOrDefaultAsync(c => c.Id == connection.Id, cancellationToken);

                return connectionWithData ?? connection;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error creating session hierarchy from match {MatchRequestId}", matchRequestId);
                throw;
            }
        });
    }

    public async Task<SessionSeries> CreateSessionSeriesAsync(
        string connectionId,
        string title,
        string teacherUserId,
        string learnerUserId,
        string skillId,
        int totalSessions,
        int defaultDurationMinutes = 60,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var connection = await _dbContext.Connections
            .FirstOrDefaultAsync(c => c.Id == connectionId, cancellationToken);

        if (connection == null)
        {
            throw new ResourceNotFoundException("Connection", connectionId);
        }

        return await CreateSessionSeriesInternalAsync(
            connectionId,
            title,
            teacherUserId,
            learnerUserId,
            skillId,
            totalSessions,
            defaultDurationMinutes,
            description,
            cancellationToken);
    }

    public async Task<SessionAppointment> ScheduleSessionAsync(
        string sessionSeriesId,
        string title,
        DateTime scheduledDate,
        int durationMinutes,
        string organizerUserId,
        string participantUserId,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var series = await _dbContext.SessionSeries
            .Include(s => s.SessionAppointments)
            .FirstOrDefaultAsync(s => s.Id == sessionSeriesId, cancellationToken);

        if (series == null)
        {
            throw new ResourceNotFoundException("SessionSeries", sessionSeriesId);
        }

        var sessionNumber = series.SessionAppointments.Count + 1;

        var appointment = SessionAppointment.Create(
            sessionSeriesId: sessionSeriesId,
            title: title,
            scheduledDate: scheduledDate,
            durationMinutes: durationMinutes,
            sessionNumber: sessionNumber,
            organizerUserId: organizerUserId,
            participantUserId: participantUserId,
            description: description
        );

        // Generate meeting link
        await _dbContext.SessionAppointments.AddAsync(appointment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var meetingLink = await _meetingLinkService.GenerateMeetingLinkAsync(appointment.Id, cancellationToken);
            appointment.UpdateMeetingLink(meetingLink);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate meeting link for appointment {AppointmentId}", appointment.Id);
        }

        // Publish event
        await _eventPublisher.Publish(new SessionScheduledEvent(
            appointment.Id,
            sessionSeriesId,
            appointment.ScheduledDate,
            appointment.OrganizerUserId,
            appointment.ParticipantUserId
        ), cancellationToken);

        _logger.LogInformation(
            "Session scheduled: {AppointmentId}, Series: {SeriesId}, Date: {ScheduledDate}",
            appointment.Id, sessionSeriesId, scheduledDate);

        return appointment;
    }

    public async Task CompleteSessionAsync(
        string sessionAppointmentId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .Include(a => a.SessionSeries)
            .ThenInclude(s => s.Connection)
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        // Validate state transition
        SessionAppointmentStateMachine.ValidateTransitionOrThrow(
            appointment.Status,
            SessionAppointmentStatus.Completed);

        // Use EF Core Execution Strategy to handle transactions with retry policy
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                // 1. Complete the appointment
                appointment.Complete();

                // 2. Update session series
                appointment.SessionSeries.CompleteSession();

                // 3. Update connection
                appointment.SessionSeries.Connection.IncrementCompletedSessions();

                // 4. Update session balance for skill exchange
                if (appointment.SessionSeries.Connection.IsSkillExchange)
                {
                    appointment.SessionSeries.Connection.UpdateSessionBalance(
                        appointment.DurationMinutes,
                        appointment.OrganizerUserId);
                }

                await _dbContext.SaveChangesAsync(cancellationToken);

                // 5. Publish event
                await _eventPublisher.Publish(new SessionCompletedEvent(
                    appointment.Id,
                    appointment.SessionSeriesId,
                    appointment.SessionSeries.ConnectionId,
                    appointment.OrganizerUserId,
                    appointment.ParticipantUserId,
                    appointment.DurationMinutes
                ), cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation(
                    "Session completed: {AppointmentId}, Series completed: {SeriesCompleted}/{TotalSessions}, Connection completed: {ConnectionCompleted}/{TotalPlanned}",
                    appointment.Id,
                    appointment.SessionSeries.CompletedSessions,
                    appointment.SessionSeries.TotalSessions,
                    appointment.SessionSeries.Connection.TotalSessionsCompleted,
                    appointment.SessionSeries.Connection.TotalSessionsPlanned);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error completing session {AppointmentId}", sessionAppointmentId);
                throw;
            }
        });
    }

    public async Task CancelSessionAsync(
        string sessionAppointmentId,
        string cancelledByUserId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        // Validate cancellation is allowed
        if (!SessionAppointmentStateMachine.CanBeCancelled(appointment.Status))
        {
            throw new System.InvalidOperationException(
                $"Cannot cancel appointment in status '{appointment.Status}'");
        }

        appointment.Cancel(cancelledByUserId, reason);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish event
        await _eventPublisher.Publish(new SessionCancelledEvent(
            appointment.Id,
            appointment.SessionSeriesId,
            cancelledByUserId,
            reason,
            appointment.IsLateCancellation
        ), cancellationToken);

        _logger.LogInformation(
            "Session cancelled: {AppointmentId}, By: {CancelledByUserId}, Late: {IsLate}",
            appointment.Id, cancelledByUserId, appointment.IsLateCancellation);
    }

    public async Task RequestRescheduleAsync(
        string sessionAppointmentId,
        string requestedByUserId,
        DateTime proposedDate,
        int? proposedDuration,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        if (!SessionAppointmentStateMachine.CanBeRescheduled(appointment.Status))
        {
            throw new System.InvalidOperationException(
                $"Cannot reschedule appointment in status '{appointment.Status}'");
        }

        appointment.RequestReschedule(requestedByUserId, proposedDate, proposedDuration, reason);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish event
        await _eventPublisher.Publish(new SessionRescheduleRequestedEvent(
            appointment.Id,
            requestedByUserId,
            proposedDate,
            proposedDuration,
            reason
        ), cancellationToken);

        _logger.LogInformation(
            "Reschedule requested for session {AppointmentId} by {UserId}. Proposed date: {ProposedDate}",
            appointment.Id, requestedByUserId, proposedDate);
    }

    public async Task ApproveRescheduleAsync(
        string sessionAppointmentId,
        string approvedByUserId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        if (!appointment.IsRescheduleRequested)
        {
            throw new System.InvalidOperationException("No reschedule request to approve");
        }

        var oldDate = appointment.ScheduledDate;
        var newDate = appointment.ProposedRescheduleDate!.Value;

        appointment.ApproveReschedule();
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish event
        await _eventPublisher.Publish(new SessionRescheduledEvent(
            appointment.Id,
            oldDate,
            newDate,
            approvedByUserId
        ), cancellationToken);

        _logger.LogInformation(
            "Reschedule approved for session {AppointmentId}. Old: {OldDate}, New: {NewDate}",
            appointment.Id, oldDate, newDate);
    }

    public async Task RejectRescheduleAsync(
        string sessionAppointmentId,
        string rejectedByUserId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        if (!appointment.IsRescheduleRequested)
        {
            throw new System.InvalidOperationException("No reschedule request to reject");
        }

        appointment.RejectReschedule();
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Reschedule rejected for session {AppointmentId} by {UserId}",
            appointment.Id, rejectedByUserId);
    }

    public async Task MarkAsNoShowAsync(
        string sessionAppointmentId,
        string noShowUserIds,
        string reportedByUserId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.SessionAppointments
            .FirstOrDefaultAsync(a => a.Id == sessionAppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", sessionAppointmentId);
        }

        appointment.MarkAsNoShow(noShowUserIds);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish event
        await _eventPublisher.Publish(new SessionNoShowEvent(
            appointment.Id,
            noShowUserIds,
            reportedByUserId
        ), cancellationToken);

        _logger.LogInformation(
            "Session marked as no-show: {AppointmentId}, NoShow users: {NoShowUserIds}",
            appointment.Id, noShowUserIds);
    }

    // Private helper method
    private async Task<SessionSeries> CreateSessionSeriesInternalAsync(
        string connectionId,
        string title,
        string teacherUserId,
        string learnerUserId,
        string skillId,
        int totalSessions,
        int defaultDurationMinutes,
        string? description,
        CancellationToken cancellationToken)
    {
        var series = SessionSeries.Create(
            connectionId: connectionId,
            title: title,
            teacherUserId: teacherUserId,
            learnerUserId: learnerUserId,
            skillId: skillId,
            totalSessions: totalSessions,
            defaultDurationMinutes: defaultDurationMinutes,
            description: description
        );

        await _dbContext.SessionSeries.AddAsync(series, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "SessionSeries created: {SeriesId}, Connection: {ConnectionId}, TotalSessions: {TotalSessions}",
            series.Id, connectionId, totalSessions);

        return series;
    }
}
