using System.Text.Json;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.Services;

/// <summary>
/// Service to enrich appointment data with user and skill information
/// This service fetches all necessary data within the AppointmentService
/// to create complete integration events without relying on other services
/// </summary>
public class AppointmentDataEnrichmentService : IAppointmentDataEnrichmentService
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AppointmentDataEnrichmentService> _logger;

    public AppointmentDataEnrichmentService(
        AppointmentDbContext dbContext,
        IHttpClientFactory httpClientFactory,
        ILogger<AppointmentDataEnrichmentService> logger)
    {
        _dbContext = dbContext;
        _httpClientFactory = httpClientFactory;
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
            var userServiceClient = _httpClientFactory.CreateClient("UserService");
            var response = await userServiceClient.GetAsync($"/users/{userId}", cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var userData = JsonSerializer.Deserialize<UserDetailsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return new UserData
                {
                    UserId = userId,
                    Email = userData?.Email ?? $"user_{userId}@skillswap.com",
                    FirstName = userData?.FirstName ?? "Unknown",
                    LastName = userData?.LastName ?? "User",
                    PhoneNumber = userData?.PhoneNumber
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
            var skillServiceClient = _httpClientFactory.CreateClient("SkillService");
            var response = await skillServiceClient.GetAsync($"/skills/{skillId}", cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var skillData = JsonSerializer.Deserialize<SkillDetailsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return new SkillData
                {
                    SkillId = skillId,
                    Name = skillData?.Name ?? "Unknown Skill",
                    Category = skillData?.Category,
                    Description = skillData?.Description
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

internal class UserDetailsResponse
{
    public string? Id { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? UserName { get; set; }
    public string? PhoneNumber { get; set; }
}

internal class SkillDetailsResponse
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
}