using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Services;
using AppointmentService.Infrastructure.Data;
using Infrastructure.Communication;
using Contracts.User.Responses;
using Contracts.Skill.Responses;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.Services;

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
        SessionAppointment appointment,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("🔄 [EnrichmentService] Starting enrichment for SessionAppointment {AppointmentId}", appointment.Id);

        var enrichedData = new EnrichedAppointmentData
        {
            AppointmentId = appointment.Id,
            ScheduledDate = appointment.ScheduledDate,
            DurationMinutes = appointment.DurationMinutes,
            MeetingLink = appointment.MeetingLink,
            Status = appointment.Status
        };

        _logger.LogDebug("📋 [EnrichmentService] Appointment basic data - OrganizerUserId: {OrganizerUserId}, ParticipantUserId: {ParticipantUserId}, MeetingLink: {MeetingLink}",
            appointment.OrganizerUserId, appointment.ParticipantUserId, appointment.MeetingLink);

        // Fetch user data in parallel
        _logger.LogInformation("👥 [EnrichmentService] Fetching user data in parallel for organizer and participant");
        var organizerTask = FetchUserDataAsync(appointment.OrganizerUserId, cancellationToken);
        var participantTask = FetchUserDataAsync(appointment.ParticipantUserId, cancellationToken);

        await Task.WhenAll(organizerTask, participantTask);

        enrichedData.Organizer = await organizerTask;
        enrichedData.Participant = await participantTask;

        _logger.LogInformation("✅ [EnrichmentService] User data fetched - Organizer: {OrganizerName}, Participant: {ParticipantName}",
            $"{enrichedData.Organizer.FirstName} {enrichedData.Organizer.LastName}",
            $"{enrichedData.Participant.FirstName} {enrichedData.Participant.LastName}");

        // Fetch skill data if available (from SessionSeries)
        var connection = appointment.SessionSeries?.Connection;
        var skillId = connection?.SkillId;
        _logger.LogDebug("🎯 [EnrichmentService] SkillId from SessionSeries: {SkillId}", skillId ?? "NULL");

        if (!string.IsNullOrEmpty(skillId))
        {
            enrichedData.Skill = await FetchSkillDataAsync(skillId, cancellationToken);
            _logger.LogInformation("✅ [EnrichmentService] Skill data enriched: {SkillName}", enrichedData.Skill?.Name);
        }
        else
        {
            _logger.LogWarning("⚠️ [EnrichmentService] No SkillId found in SessionSeries - Skill data will be NULL");
        }

        // Fetch Match/Connection Rollen (INITIATOR und PARTICIPANT)
        // Diese Rollen sind KONSTANT durch die gesamte Kette Match → Appointment → VideoCall
        var requesterId = connection?.RequesterId;
        var targetUserId = connection?.TargetUserId;

        if (!string.IsNullOrEmpty(requesterId) && !string.IsNullOrEmpty(targetUserId))
        {
            _logger.LogInformation("👥 [EnrichmentService] Fetching Match requester/target data - RequesterId: {RequesterId}, TargetUserId: {TargetUserId}",
                requesterId, targetUserId);

            // Optimize: Reuse already fetched user data if IDs match
            if (requesterId == appointment.OrganizerUserId)
            {
                enrichedData.MatchRequester = enrichedData.Organizer;
            }
            else if (requesterId == appointment.ParticipantUserId)
            {
                enrichedData.MatchRequester = enrichedData.Participant;
            }
            else
            {
                enrichedData.MatchRequester = await FetchUserDataAsync(requesterId, cancellationToken);
            }

            if (targetUserId == appointment.OrganizerUserId)
            {
                enrichedData.MatchTarget = enrichedData.Organizer;
            }
            else if (targetUserId == appointment.ParticipantUserId)
            {
                enrichedData.MatchTarget = enrichedData.Participant;
            }
            else
            {
                enrichedData.MatchTarget = await FetchUserDataAsync(targetUserId, cancellationToken);
            }

            _logger.LogInformation("✅ [EnrichmentService] Match roles enriched - Requester: {RequesterName}, Target: {TargetName}",
                $"{enrichedData.MatchRequester?.FirstName} {enrichedData.MatchRequester?.LastName}",
                $"{enrichedData.MatchTarget?.FirstName} {enrichedData.MatchTarget?.LastName}");
        }
        else
        {
            _logger.LogDebug("ℹ️ [EnrichmentService] No Connection data available - Match roles will be NULL");
        }

        _logger.LogInformation("✅ [EnrichmentService] Enrichment completed for appointment {AppointmentId}", appointment.Id);
        return enrichedData;
    }

    private async Task<UserData> FetchUserDataAsync(string userId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("🔍 [EnrichmentService] Fetching user data for UserId: {UserId}", userId);

        try
        {
            _logger.LogDebug("📡 [EnrichmentService] Sending request to UserService: GET /api/users/internal/{UserId}", userId);

            var response = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "userservice",
                $"/api/users/internal/{userId}",
                cancellationToken);

            if (response != null)
            {
                _logger.LogInformation("✅ [EnrichmentService] User data fetched successfully for {UserId} - Email: {Email}, Name: {FirstName} {LastName}",
                    userId, response.Email, response.FirstName, response.LastName);

                return new UserData
                {
                    UserId = userId,
                    Email = response.Email ?? $"user_{userId}@skillswap.com",
                    FirstName = response.FirstName ?? "Unknown",
                    LastName = response.LastName ?? "User",
                    PhoneNumber = response.PhoneNumber
                };
            }
            else
            {
                _logger.LogWarning("⚠️ [EnrichmentService] UserService returned NULL for UserId: {UserId} - Using fallback data", userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [EnrichmentService] Failed to fetch user data for {UserId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                userId, ex.Message, ex.StackTrace);
        }

        // Return default data if fetch fails
        _logger.LogWarning("⚠️ [EnrichmentService] Returning FALLBACK user data for {UserId}", userId);
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
        _logger.LogInformation("🔍 [EnrichmentService] Fetching skill data for SkillId: {SkillId}", skillId);

        try
        {
            _logger.LogDebug("📡 [EnrichmentService] Sending request to SkillService: GET /api/skills/{SkillId}", skillId);

            var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                "skillservice",
                $"/api/skills/{skillId}",
                cancellationToken);

            if (response != null)
            {
                _logger.LogInformation("✅ [EnrichmentService] Skill data fetched successfully for {SkillId} - Name: {Name}, Category: {Category}",
                    skillId, response.Name, response.Category?.Name);

                return new SkillData
                {
                    SkillId = skillId,
                    Name = response.Name ?? "Unknown Skill",
                    Category = response.Category?.Name,
                    Description = response.Description
                };
            }
            else
            {
                _logger.LogWarning("⚠️ [EnrichmentService] SkillService returned NULL for SkillId: {SkillId} - Using fallback data", skillId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [EnrichmentService] Failed to fetch skill data for {SkillId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                skillId, ex.Message, ex.StackTrace);
        }

        // Return default data if fetch fails
        _logger.LogWarning("⚠️ [EnrichmentService] Returning FALLBACK skill data for {SkillId}", skillId);
        return new SkillData
        {
            SkillId = skillId,
            Name = "Unknown Skill"
        };
    }
}
