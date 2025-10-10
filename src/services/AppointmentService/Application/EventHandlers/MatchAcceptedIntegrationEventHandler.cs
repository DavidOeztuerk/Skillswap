using AppointmentService.Domain.Entities;
using Events.Integration.Matchmaking;
using Events.Domain.Appointment;
using EventSourcing;
using MassTransit;

namespace AppointmentService.Application.EventHandlers;

public class MatchAcceptedIntegrationEventHandler : IConsumer<MatchAcceptedIntegrationEvent>
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly ILogger<MatchAcceptedIntegrationEventHandler> _logger;

    public MatchAcceptedIntegrationEventHandler(
        AppointmentDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        ILogger<MatchAcceptedIntegrationEventHandler> logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchAcceptedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Creating appointment for accepted match: {MatchId}", message.MatchId);

        {
            // Calculate initial appointment date (e.g., next available day from preferred days)
            var scheduledDate = CalculateFirstAppointmentDate(
                message.PreferredDays,
                message.PreferredTimes);

            // Create appointment from match
            var appointment = new Appointment
            {
                Id = Guid.NewGuid().ToString(),
                Title = $"Skill-Exchange: {message.SkillName}",
                Description = BuildAppointmentDescription(message),
                ScheduledDate = scheduledDate,
                DurationMinutes = message.SessionDurationMinutes,
                OrganizerUserId = message.RequesterId,
                ParticipantUserId = message.TargetUserId,
                SkillId = message.SkillId,
                MatchId = message.MatchId,
                MeetingType = message.IsSkillExchange ? "Exchange" : "Learning",

                // Exchange details
                IsSkillExchange = message.IsSkillExchange,
                ExchangeSkillId = message.ExchangeSkillId,

                // Payment details
                IsMonetary = message.IsMonetary,
                Amount = message.AgreedAmount,
                Currency = message.Currency,

                // Session tracking
                SessionNumber = 1,
                TotalSessions = message.TotalSessions,

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            // Auto-accept appointment since both parties already accepted the match
            appointment.Accept();

            _dbContext.Appointments.Add(appointment);
            await _dbContext.SaveChangesAsync();

            // Publish domain event for appointment creation
            await _eventPublisher.Publish(new AppointmentCreatedDomainEvent(
                appointment.Id,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId,
                appointment.Title,
                appointment.ScheduledDate,
                appointment.SkillId,
                appointment.MatchId),
                context.CancellationToken);

            // Publish domain event for appointment acceptance (both parties accepted via match)
            await _eventPublisher.Publish(new AppointmentAcceptedDomainEvent(
                appointment.Id,
                message.RequesterId, // Requester accepted the match
                message.TargetUserId, // Target user also accepted
                appointment.ScheduledDate,
                appointment.DurationMinutes,
                appointment.SkillId,
                BothPartiesAccepted: true), // Both parties accepted via match acceptance
                context.CancellationToken);

            _logger.LogInformation(
                "Successfully created and auto-accepted appointment {AppointmentId} for match {MatchId}",
                appointment.Id, message.MatchId);

            // Create follow-up appointments if multiple sessions are planned
            if (message.TotalSessions > 1)
            {
                await CreateFollowUpAppointments(appointment, message, context.CancellationToken);
            }
        }
    }

    private DateTime CalculateFirstAppointmentDate(string[] preferredDays, string[] preferredTimes)
    {
        // Get next available day from preferred days
        var today = DateTime.UtcNow.Date;
        var targetDate = today.AddDays(3); // Default: 3 days from now

        if (preferredDays?.Length > 0)
        {
            // Find next preferred weekday
            for (int i = 0; i < 7; i++)
            {
                var checkDate = today.AddDays(i + 1);
                var dayName = checkDate.ToString("dddd");
                
                if (preferredDays.Any(d => d.Equals(dayName, StringComparison.OrdinalIgnoreCase)))
                {
                    targetDate = checkDate;
                    break;
                }
            }
        }

        // Set preferred time
        var targetTime = TimeSpan.FromHours(18); // Default: 6 PM
        
        if (preferredTimes?.Length > 0)
        {
            // Parse first preferred time
            if (TimeSpan.TryParse(preferredTimes[0], out var parsedTime))
            {
                targetTime = parsedTime;
            }
        }

        return targetDate.Add(targetTime);
    }

    private string BuildAppointmentDescription(MatchAcceptedIntegrationEvent message)
    {
        var description = $"Match-basierter Termin für {message.SkillName}\n";
        description += $"Teilnehmer: {message.RequesterName} & {message.TargetUserName}\n";

        if (message.IsSkillExchange && !string.IsNullOrEmpty(message.ExchangeSkillName))
        {
            description += $"Skill-Tausch: {message.SkillName} ⇄ {message.ExchangeSkillName}\n";
        }

        if (message.IsMonetary && message.AgreedAmount.HasValue)
        {
            description += $"Bezahlung: {message.AgreedAmount:C} {message.Currency}\n";
        }

        description += $"\nSession 1 von {message.TotalSessions}";
        return description;
    }

    private async Task CreateFollowUpAppointments(
        Appointment firstAppointment,
        MatchAcceptedIntegrationEvent message,
        CancellationToken cancellationToken)
    {
        var appointments = new List<Appointment>();
        
        for (int sessionNumber = 2; sessionNumber <= message.TotalSessions; sessionNumber++)
        {
            var scheduledDate = firstAppointment.ScheduledDate.AddDays(7 * (sessionNumber - 1));
            
            var followUpAppointment = new Appointment
            {
                Id = Guid.NewGuid().ToString(),
                Title = $"{firstAppointment.Title} - Session {sessionNumber}",
                Description = firstAppointment.Description?.Replace("Session 1", $"Session {sessionNumber}"),
                ScheduledDate = scheduledDate,
                DurationMinutes = firstAppointment.DurationMinutes,
                OrganizerUserId = firstAppointment.OrganizerUserId,
                ParticipantUserId = firstAppointment.ParticipantUserId,
                SkillId = firstAppointment.SkillId,
                MatchId = firstAppointment.MatchId,
                MeetingType = firstAppointment.MeetingType,

                IsSkillExchange = firstAppointment.IsSkillExchange,
                ExchangeSkillId = firstAppointment.ExchangeSkillId,
                IsMonetary = firstAppointment.IsMonetary,
                Amount = firstAppointment.Amount,
                Currency = firstAppointment.Currency,

                SessionNumber = sessionNumber,
                TotalSessions = message.TotalSessions,

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            // Auto-accept follow-up appointments as well
            followUpAppointment.Accept();

            appointments.Add(followUpAppointment);
        }

        if (appointments.Any())
        {
            _dbContext.Appointments.AddRange(appointments);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish acceptance events for all follow-up appointments
            foreach (var followUpAppointment in appointments)
            {
                await _eventPublisher.Publish(new AppointmentAcceptedDomainEvent(
                    followUpAppointment.Id,
                    message.RequesterId,
                    message.TargetUserId,
                    followUpAppointment.ScheduledDate,
                    followUpAppointment.DurationMinutes,
                    followUpAppointment.SkillId,
                    BothPartiesAccepted: true),
                    cancellationToken);
            }

            _logger.LogInformation(
                "Created and auto-accepted {Count} follow-up appointments for match {MatchId}",
                appointments.Count, message.MatchId);
        }
    }
}