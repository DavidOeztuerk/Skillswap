using AppointmentService.Application.Services;
using AppointmentService.Domain.Entities;
using CQRS.Handlers;
using Events.Domain.Appointment;
using Events.Integration.AppointmentManagement;
using EventSourcing;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles appointment accepted domain events
/// Generates meeting links and publishes integration events for other services
/// </summary>
public class AppointmentAcceptedEventHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IAppointmentDataEnrichmentService enrichmentService,
    ILogger<AppointmentAcceptedEventHandler> logger,
    IHttpClientFactory httpClientFactory)
    : BaseDomainEventHandler<AppointmentAcceptedDomainEvent>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IAppointmentDataEnrichmentService _enrichmentService = enrichmentService;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;

    protected override async Task HandleDomainEvent(AppointmentAcceptedDomainEvent notification, CancellationToken cancellationToken)
    {
        {
            // Only generate meeting link when both parties have accepted
            if (!notification.BothPartiesAccepted)
            {
                Logger.LogInformation("Appointment {AppointmentId} accepted by one party, waiting for other party",
                    notification.AppointmentId);
                return; // Exit early if not both parties accepted
            }

            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == notification.AppointmentId, cancellationToken);

            if (appointment == null)
            {
                Logger.LogWarning("Appointment {AppointmentId} not found", notification.AppointmentId);
                return;
            }

            // Check if meeting link already exists
            if (!string.IsNullOrEmpty(appointment.MeetingLink))
            {
                Logger.LogInformation("Meeting link already exists for appointment {AppointmentId}",
                    notification.AppointmentId);
                return;
            }

            // Generate meeting link via VideocallService
            var meetingLink = await GenerateMeetingLink(appointment, cancellationToken);

            if (string.IsNullOrEmpty(meetingLink))
            {
                Logger.LogError("Failed to generate meeting link for appointment {AppointmentId}",
                    notification.AppointmentId);
                return;
            }

            // Save meeting link to appointment
            appointment.MeetingLink = meetingLink;
            appointment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Enrich appointment data with user and skill information
            var enrichedData = await _enrichmentService.EnrichAppointmentDataAsync(appointment, cancellationToken);

            // Publish integration event for NotificationService and other consumers
            await _publishEndpoint.Publish(new AppointmentAcceptedIntegrationEvent
            {
                AppointmentId = appointment.Id,
                ScheduledDate = appointment.ScheduledDate,
                DurationMinutes = appointment.DurationMinutes,
                MeetingLink = meetingLink,
                
                // Organizer information
                OrganizerUserId = enrichedData.Organizer.UserId,
                OrganizerEmail = enrichedData.Organizer.Email,
                OrganizerFirstName = enrichedData.Organizer.FirstName,
                OrganizerLastName = enrichedData.Organizer.LastName,
                OrganizerPhoneNumber = enrichedData.Organizer.PhoneNumber,
                
                // Participant information
                ParticipantUserId = enrichedData.Participant.UserId,
                ParticipantEmail = enrichedData.Participant.Email,
                ParticipantFirstName = enrichedData.Participant.FirstName,
                ParticipantLastName = enrichedData.Participant.LastName,
                ParticipantPhoneNumber = enrichedData.Participant.PhoneNumber,
                
                // Skill information
                SkillId = enrichedData.Skill?.SkillId,
                SkillName = enrichedData.Skill?.Name,
                SkillCategory = enrichedData.Skill?.Category,
                SkillDescription = enrichedData.Skill?.Description,
                
                // Metadata
                AcceptedAt = DateTime.UtcNow,
                BothPartiesAccepted = notification.BothPartiesAccepted
            }, cancellationToken);

            // Also publish domain event for internal processing
            await _eventPublisher.Publish(new MeetingLinkGeneratedDomainEvent(
                appointment.Id,
                meetingLink,
                enrichedData.Organizer.UserId,
                enrichedData.Organizer.Email,
                $"{enrichedData.Organizer.FirstName} {enrichedData.Organizer.LastName}",
                enrichedData.Participant.UserId,
                enrichedData.Participant.Email,
                $"{enrichedData.Participant.FirstName} {enrichedData.Participant.LastName}",
                appointment.ScheduledDate,
                appointment.DurationMinutes,
                enrichedData.Skill?.Name), cancellationToken);

            Logger.LogInformation("Meeting link generated for appointment {AppointmentId}: {MeetingLink}",
                appointment.Id, meetingLink);
        }
    }

    private async Task<string> GenerateMeetingLink(Appointment appointment, CancellationToken cancellationToken)
    {
        {
            // Call VideocallService to create a session
            var httpClient = _httpClientFactory.CreateClient("VideocallService");

            var request = new
            {
                appointmentId = appointment.Id,
                scheduledDate = appointment.ScheduledDate,
                durationMinutes = appointment.DurationMinutes,
                participantIds = new[] { appointment.OrganizerUserId, appointment.ParticipantUserId }
            };

            var response = await httpClient.PostAsJsonAsync("/sessions/create", request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<VideocallSessionResponse>(cancellationToken: cancellationToken);
                return result?.MeetingLink ?? GenerateFallbackMeetingLink(appointment);
            }

            Logger.LogWarning("VideocallService returned {StatusCode} when creating session", response.StatusCode);
            return GenerateFallbackMeetingLink(appointment);
        }
    }

    private static string GenerateFallbackMeetingLink(Appointment? appointment)
    {
        // Fallback: Generate a simple meeting link
        var meetingId = Guid.NewGuid().ToString("N")[..8];
        return $"https://meet.skillswap.com/session/{meetingId}";
    }

    private class VideocallSessionResponse
    {
        public string? SessionId { get; set; }
        public string? MeetingLink { get; set; }
    }

}