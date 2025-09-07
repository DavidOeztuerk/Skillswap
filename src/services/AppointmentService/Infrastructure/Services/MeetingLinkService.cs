using AppointmentService.Application.Services;
using Events.Domain.Appointment;
using EventSourcing;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Core.Common.Exceptions;

namespace AppointmentService.Infrastructure.Services;

public class MeetingLinkService : IMeetingLinkService
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MeetingLinkService> _logger;
    private const int LINK_ACTIVATION_DELAY_MINUTES = 5;
    private const int LINK_VALIDITY_HOURS = 24;

    public MeetingLinkService(
        AppointmentDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        IConfiguration configuration,
        ILogger<MeetingLinkService> logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("Appointment", appointmentId);
        }

        // Generate secure token
        var token = GenerateSecureToken();
        
        // Build meeting URL
        var baseUrl = _configuration["Meeting:BaseUrl"] ?? "https://meet.skillswap.app";
        var meetingLink = $"{baseUrl}/room/{appointmentId}?token={token}";

        // Store meeting link and metadata
        appointment.MeetingLink = meetingLink;
        appointment.UpdatedAt = DateTime.UtcNow;
        
        // Store token and activation time in metadata (would be better in separate table)
        var activationTime = DateTime.UtcNow.AddMinutes(LINK_ACTIVATION_DELAY_MINUTES);
        var expirationTime = appointment.ScheduledDate.AddHours(LINK_VALIDITY_HOURS);
        
        // In real implementation, store in separate MeetingLink table
        // For now, we'll use the MeetingLink field
        appointment.MeetingLink = $"{meetingLink}&activation={activationTime:O}&expiration={expirationTime:O}";

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish domain event (we need to fetch user details in real implementation)
        await _eventPublisher.Publish(new MeetingLinkGeneratedDomainEvent(
            appointmentId,
            meetingLink,
            appointment.OrganizerUserId,
            "", // TODO: Get email from UserService
            "", // TODO: Get name from UserService
            appointment.ParticipantUserId,
            "", // TODO: Get email from UserService
            "", // TODO: Get name from UserService
            appointment.ScheduledDate,
            appointment.DurationMinutes,
            appointment.SkillId),
            cancellationToken);

        _logger.LogInformation(
            "Generated meeting link for appointment {AppointmentId}. Activation at {ActivationTime}",
            appointmentId, activationTime);

        return meetingLink;
    }

    public async Task<bool> VerifyMeetingLinkAsync(string appointmentId, string token, CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment == null || string.IsNullOrEmpty(appointment.MeetingLink))
        {
            return false;
        }

        // Extract metadata from link (in real implementation, query from MeetingLink table)
        if (!appointment.MeetingLink.Contains(token))
        {
            _logger.LogWarning("Invalid token for appointment {AppointmentId}", appointmentId);
            return false;
        }

        // Check if link is activated
        if (appointment.MeetingLink.Contains("&activation="))
        {
            var activationIndex = appointment.MeetingLink.IndexOf("&activation=") + 12;
            var activationEndIndex = appointment.MeetingLink.IndexOf("&", activationIndex);
            if (activationEndIndex == -1) activationEndIndex = appointment.MeetingLink.Length;
            
            var activationString = appointment.MeetingLink.Substring(activationIndex, activationEndIndex - activationIndex);
            if (DateTime.TryParse(activationString, out var activationTime))
            {
                if (DateTime.UtcNow < activationTime)
                {
                    _logger.LogInformation(
                        "Meeting link for appointment {AppointmentId} not yet active. Activation at {ActivationTime}",
                        appointmentId, activationTime);
                    return false;
                }
            }
        }

        // Check if link is expired
        if (appointment.MeetingLink.Contains("&expiration="))
        {
            var expirationIndex = appointment.MeetingLink.IndexOf("&expiration=") + 12;
            var expirationString = appointment.MeetingLink.Substring(expirationIndex);
            
            if (DateTime.TryParse(expirationString, out var expirationTime))
            {
                if (DateTime.UtcNow > expirationTime)
                {
                    _logger.LogWarning(
                        "Meeting link for appointment {AppointmentId} has expired at {ExpirationTime}",
                        appointmentId, expirationTime);
                    return false;
                }
            }
        }

        return true;
    }

    public async Task<string> RefreshMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("Appointment", appointmentId);
        }

        // Generate new token and link
        var newLink = await GenerateMeetingLinkAsync(appointmentId, cancellationToken);
        
        _logger.LogInformation("Refreshed meeting link for appointment {AppointmentId}", appointmentId);
        
        return newLink;
    }

    public async Task<bool> IsMeetingLinkActiveAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment == null || string.IsNullOrEmpty(appointment.MeetingLink))
        {
            return false;
        }

        // Check activation time
        if (appointment.MeetingLink.Contains("&activation="))
        {
            var activationIndex = appointment.MeetingLink.IndexOf("&activation=") + 12;
            var activationEndIndex = appointment.MeetingLink.IndexOf("&", activationIndex);
            if (activationEndIndex == -1) activationEndIndex = appointment.MeetingLink.Length;
            
            var activationString = appointment.MeetingLink.Substring(activationIndex, activationEndIndex - activationIndex);
            if (DateTime.TryParse(activationString, out var activationTime))
            {
                var isActive = DateTime.UtcNow >= activationTime;
                
                if (!isActive)
                {
                    var timeUntilActive = activationTime - DateTime.UtcNow;
                    _logger.LogInformation(
                        "Meeting link for appointment {AppointmentId} will be active in {Minutes} minutes",
                        appointmentId, timeUntilActive.TotalMinutes);
                }
                
                return isActive;
            }
        }

        // If no activation time found, consider it active
        return true;
    }

    private string GenerateSecureToken(int length = 32)
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}