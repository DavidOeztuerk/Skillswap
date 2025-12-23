using Events.Integration.Appointment;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Infrastructure.Consumers;

/// <summary>
/// Consumes AppointmentsCreatedIntegrationEvent to sync appointments to users' external calendars.
/// When appointments are created from a match, this consumer creates calendar events in
/// connected calendars (Google, Microsoft, Apple) for both the organizer and participant.
/// </summary>
public class AppointmentsCreatedCalendarSyncConsumer : IConsumer<AppointmentsCreatedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<AppointmentsCreatedCalendarSyncConsumer> _logger;

    public AppointmentsCreatedCalendarSyncConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<AppointmentsCreatedCalendarSyncConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AppointmentsCreatedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[CalendarSync] Processing {Count} appointments for match {MatchId}. Organizer: {OrganizerId}, Participant: {ParticipantId}",
            message.Appointments.Length, message.MatchId, message.OrganizerUserId, message.ParticipantUserId);

        try
        {
            // Sync to both users' calendars in parallel
            var organizerTask = SyncAppointmentsToUserCalendarsAsync(
                message.OrganizerUserId,
                message.OrganizerName,
                message.ParticipantName,
                message.SkillName,
                message.Appointments,
                context.CancellationToken);

            var participantTask = SyncAppointmentsToUserCalendarsAsync(
                message.ParticipantUserId,
                message.ParticipantName,
                message.OrganizerName,
                message.SkillName,
                message.Appointments,
                context.CancellationToken);

            await Task.WhenAll(organizerTask, participantTask);

            _logger.LogInformation(
                "[CalendarSync] Completed calendar sync for match {MatchId}",
                message.MatchId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[CalendarSync] Error syncing appointments for match {MatchId}",
                message.MatchId);
            // Don't rethrow - calendar sync failure should not block the main flow
        }
    }

    private async Task SyncAppointmentsToUserCalendarsAsync(
        string userId,
        string userName,
        string partnerName,
        string skillName,
        AppointmentSummary[] appointments,
        CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var connectionRepository = scope.ServiceProvider.GetRequiredService<IUserCalendarConnectionRepository>();
        var eventRepository = scope.ServiceProvider.GetRequiredService<IAppointmentCalendarEventRepository>();
        var calendarServiceFactory = scope.ServiceProvider.GetRequiredService<ICalendarServiceFactory>();
        var encryptionService = scope.ServiceProvider.GetRequiredService<ITokenEncryptionService>();

        // Get user's connected calendars
        var connections = await connectionRepository.GetByUserIdAsync(userId, cancellationToken);

        if (connections.Count == 0)
        {
            _logger.LogInformation(
                "[CalendarSync] User {UserId} has no connected calendars, skipping sync",
                userId);
            return;
        }

        _logger.LogInformation(
            "[CalendarSync] User {UserId} has {Count} connected calendar(s): {Providers}",
            userId, connections.Count, string.Join(", ", connections.Select(c => c.Provider)));

        // Create calendar events for each appointment in each connected calendar
        foreach (var appointment in appointments)
        {
            foreach (var connection in connections.Where(c => c.SyncEnabled && !string.IsNullOrEmpty(c.AccessToken)))
            {
                try
                {
                    await CreateCalendarEventAsync(
                        connection,
                        appointment,
                        userName,
                        partnerName,
                        skillName,
                        calendarServiceFactory,
                        encryptionService,
                        eventRepository,
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "[CalendarSync] Failed to create calendar event for appointment {AppointmentId} in {Provider} for user {UserId}",
                        appointment.AppointmentId, connection.Provider, userId);

                    // Update connection with error
                    connection.LastSyncError = ex.Message;
                    connection.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        // Save any connection updates
        await connectionRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task CreateCalendarEventAsync(
        UserCalendarConnection connection,
        AppointmentSummary appointment,
        string userName,
        string partnerName,
        string skillName,
        ICalendarServiceFactory calendarServiceFactory,
        ITokenEncryptionService encryptionService,
        IAppointmentCalendarEventRepository eventRepository,
        CancellationToken cancellationToken)
    {
        // Check if event already exists for this appointment+user+provider
        var existingEvent = await eventRepository.GetByAppointmentAndUserAsync(
            appointment.AppointmentId,
            connection.UserId,
            connection.Provider,
            cancellationToken);

        if (existingEvent != null)
        {
            _logger.LogDebug(
                "[CalendarSync] Calendar event already exists for appointment {AppointmentId} in {Provider} for user {UserId}",
                appointment.AppointmentId, connection.Provider, connection.UserId);
            return;
        }

        // Get calendar service for this provider
        var calendarService = calendarServiceFactory.GetService(connection.Provider);

        // Decrypt access token
        var accessToken = encryptionService.Decrypt(connection.AccessToken);

        // Build calendar appointment
        var calendarAppointment = new CalendarAppointment
        {
            Id = appointment.AppointmentId,
            Title = $"SkillSwap: {skillName} mit {partnerName}",
            Description = BuildEventDescription(appointment, userName, partnerName, skillName),
            StartTime = appointment.ScheduledDate,
            EndTime = appointment.ScheduledDate.AddMinutes(appointment.DurationMinutes),
            Location = "Online (SkillSwap)",
            MeetingLink = appointment.MeetingLink,
            Attendees = [] // Could add partner email if available
        };

        // Create event in external calendar
        var result = await calendarService.CreateEventAsync(
            accessToken,
            calendarAppointment,
            connection.CalendarId,
            cancellationToken);

        if (result.Success)
        {
            // Track the created event
            var calendarEvent = new AppointmentCalendarEvent
            {
                Id = Guid.NewGuid().ToString(),
                AppointmentId = appointment.AppointmentId,
                UserId = connection.UserId,
                Provider = connection.Provider,
                ExternalEventId = result.ExternalEventId ?? appointment.AppointmentId,
                CalendarId = connection.CalendarId,
                SyncedAt = DateTime.UtcNow,
                Status = CalendarEventStatus.Created
            };

            await eventRepository.AddAsync(calendarEvent, cancellationToken);

            // Update connection sync stats
            connection.LastSyncAt = DateTime.UtcNow;
            connection.SyncCount++;
            connection.LastSyncError = null;

            _logger.LogInformation(
                "[CalendarSync] Created calendar event for appointment {AppointmentId} in {Provider} (ExternalId: {ExternalId})",
                appointment.AppointmentId, connection.Provider, result.ExternalEventId);
        }
        else
        {
            _logger.LogWarning(
                "[CalendarSync] Failed to create calendar event in {Provider}: {Error}",
                connection.Provider, result.Error);

            connection.LastSyncError = result.Error;
        }
    }

    private static string BuildEventDescription(
        AppointmentSummary appointment,
        string userName,
        string partnerName,
        string skillName)
    {
        return $"""
            SkillSwap Session {appointment.SessionNumber} von {appointment.TotalSessions}

            Skill: {skillName}
            Partner: {partnerName}
            Dauer: {appointment.DurationMinutes} Minuten

            Meeting Link: {appointment.MeetingLink}

            ---
            Erstellt von SkillSwap
            """;
    }
}
