using AppointmentService.Domain.Entities;
using Infrastructure.Communication;
using Contracts.User.Responses;
using Contracts.Skill.Responses;

namespace AppointmentService.Application.Services;

/// <summary>
/// Service to enrich appointment data with user and skill information
/// This service fetches all necessary data within the AppointmentService
/// to create complete integration events without relying on other services
/// </summary>
public class AppointmentDataEnrichmentService : IAppointmentDataEnrichmentService
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<AppointmentDataEnrichmentService> _logger;

    public AppointmentDataEnrichmentService(
        AppointmentDbContext dbContext,
        IServiceCommunicationManager serviceCommunication,
        ILogger<AppointmentDataEnrichmentService> logger)
    {
        _dbContext = dbContext;
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<EnrichedAppointmentData> EnrichAppointmentDataAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default)
    {
        var enrichedData = new EnrichedAppointmentData
        {
            AppointmentId = appointment.Id,
            ScheduledDate = appointment.ScheduledDate,
            DurationMinutes = appointment.DurationMinutes,
            MeetingLink = appointment.MeetingLink,
            Status = appointment.Status
        };

        // Fetch user data in parallel
        var organizerTask = FetchUserDataAsync(appointment.OrganizerUserId, cancellationToken);
        var participantTask = FetchUserDataAsync(appointment.ParticipantUserId, cancellationToken);
        
        await Task.WhenAll(organizerTask, participantTask);
        
        enrichedData.Organizer = await organizerTask;
        enrichedData.Participant = await participantTask;

        // Fetch skill data if available
        if (!string.IsNullOrEmpty(appointment.SkillId))
        {
            enrichedData.Skill = await FetchSkillDataAsync(appointment.SkillId, cancellationToken);
        }

        return enrichedData;
    }

    private async Task<UserData> FetchUserDataAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "userservice",
                $"users/internal/{userId}",
                cancellationToken);

            if (response != null)
            {
                return new UserData
                {
                    UserId = userId,
                    Email = response.Email ?? $"user_{userId}@skillswap.com",
                    FirstName = response.FirstName ?? "Unknown",
                    LastName = response.LastName ?? "User",
                    PhoneNumber = response.PhoneNumber
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch user data for {UserId}", userId);
        }

        // Return default data if fetch fails
        return new UserData
        {
            UserId = userId,
            Email = $"user_{userId}@skillswap.com",
            FirstName = "Unknown",
            LastName = "User"
        };
    }

    private async Task<SkillData> FetchSkillDataAsync(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                "skillservice",
                $"skills/{skillId}",
                cancellationToken);

            if (response != null)
            {
                return new SkillData
                {
                    SkillId = skillId,
                    Name = response.Name ?? "Unknown Skill",
                    Category = response.Category?.Name,
                    Description = response.Description
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch skill data for {SkillId}", skillId);
        }

        // Return default data if fetch fails
        return new SkillData
        {
            SkillId = skillId,
            Name = "Unknown Skill"
        };
    }
}

public class EnrichedAppointmentData
{
    public string AppointmentId { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = string.Empty;
    public UserData Organizer { get; set; } = new();
    public UserData Participant { get; set; } = new();
    public SkillData? Skill { get; set; }
}

public class UserData
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class SkillData
{
    public string SkillId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Description { get; set; }
}

