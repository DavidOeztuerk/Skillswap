using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for syncing profile data from LinkedIn
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class SyncLinkedInProfileCommandHandler : IRequestHandler<SyncLinkedInProfileCommand, ApiResponse<ProfileSyncResultResponse>>
{
    private readonly ILinkedInService _linkedInService;
    private readonly IUserLinkedInConnectionRepository _connectionRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<SyncLinkedInProfileCommandHandler> _logger;

    public SyncLinkedInProfileCommandHandler(
        ILinkedInService linkedInService,
        IUserLinkedInConnectionRepository connectionRepository,
        IUserRepository userRepository,
        ITokenEncryptionService encryptionService,
        ILogger<SyncLinkedInProfileCommandHandler> logger)
    {
        _linkedInService = linkedInService;
        _connectionRepository = connectionRepository;
        _userRepository = userRepository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<ApiResponse<ProfileSyncResultResponse>> Handle(
        SyncLinkedInProfileCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get LinkedIn connection
            var connection = await _connectionRepository.GetByUserIdAsync(request.UserId, cancellationToken);
            if (connection == null)
            {
                return ApiResponse<ProfileSyncResultResponse>.ErrorResult(
                    "LinkedIn is not connected. Please connect LinkedIn first.");
            }

            // Check if token needs refresh
            if (connection.IsTokenExpired())
            {
                var refreshResult = await RefreshTokenIfNeededAsync(connection, cancellationToken);
                if (!refreshResult)
                {
                    connection.MarkSyncError("Token expired and refresh failed");
                    await _connectionRepository.SaveChangesAsync(cancellationToken);
                    return ApiResponse<ProfileSyncResultResponse>.ErrorResult(
                        "LinkedIn token expired. Please reconnect your LinkedIn account.");
                }
            }

            // Decrypt access token
            var accessToken = _encryptionService.Decrypt(connection.AccessToken);

            // Fetch full profile from LinkedIn
            var profileResult = await _linkedInService.GetFullProfileAsync(accessToken, cancellationToken);
            if (!profileResult.Success || profileResult.Profile == null)
            {
                connection.MarkSyncError(profileResult.Error ?? "Failed to fetch profile");
                await _connectionRepository.SaveChangesAsync(cancellationToken);
                return ApiResponse<ProfileSyncResultResponse>.ErrorResult(
                    profileResult.Error ?? "Failed to fetch LinkedIn profile");
            }

            // Get user with experiences and educations
            var user = await _userRepository.GetByIdWithProfileAsync(request.UserId, cancellationToken);
            if (user == null)
            {
                return ApiResponse<ProfileSyncResultResponse>.ErrorResult("User not found");
            }

            // Transform and sync experiences
            var (experiencesImported, experiencesUpdated) = await SyncExperiencesAsync(
                user, profileResult.Profile.Positions, cancellationToken);

            // Transform and sync educations
            var (educationsImported, educationsUpdated) = await SyncEducationsAsync(
                user, profileResult.Profile.Educations, cancellationToken);

            // Update connection sync stats
            connection.MarkSyncSuccess(experiencesImported + experiencesUpdated, educationsImported + educationsUpdated);
            await _connectionRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "LinkedIn profile synced for user {UserId}: {ExpImported} experiences imported, {ExpUpdated} updated, {EduImported} educations imported, {EduUpdated} updated",
                request.UserId, experiencesImported, experiencesUpdated, educationsImported, educationsUpdated);

            return ApiResponse<ProfileSyncResultResponse>.SuccessResult(
                new ProfileSyncResultResponse
                {
                    ExperiencesImported = experiencesImported,
                    ExperiencesUpdated = experiencesUpdated,
                    EducationsImported = educationsImported,
                    EducationsUpdated = educationsUpdated,
                    SyncedAt = DateTime.UtcNow
                },
                "Profile synced successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing LinkedIn profile for user {UserId}", request.UserId);
            return ApiResponse<ProfileSyncResultResponse>.ErrorResult("Failed to sync LinkedIn profile");
        }
    }

    private async Task<bool> RefreshTokenIfNeededAsync(
        UserLinkedInConnection connection,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(connection.RefreshToken))
        {
            return false;
        }

        try
        {
            var refreshToken = _encryptionService.Decrypt(connection.RefreshToken);
            var result = await _linkedInService.RefreshAccessTokenAsync(refreshToken, cancellationToken);

            if (result.Success && !string.IsNullOrEmpty(result.AccessToken))
            {
                connection.UpdateTokens(
                    _encryptionService.Encrypt(result.AccessToken),
                    result.RefreshToken != null ? _encryptionService.Encrypt(result.RefreshToken) : connection.RefreshToken,
                    result.ExpiresAt
                );
                await _connectionRepository.SaveChangesAsync(cancellationToken);
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to refresh LinkedIn token for connection {ConnectionId}", connection.Id);
        }

        return false;
    }

    private Task<(int imported, int updated)> SyncExperiencesAsync(
        User user,
        List<LinkedInPosition> positions,
        CancellationToken cancellationToken)
    {
        var imported = 0;
        var updated = 0;

        foreach (var position in positions)
        {
            // Check if experience with this external ID already exists
            var existing = user.Experiences.FirstOrDefault(e =>
                e.Source == ProfileDataSource.LinkedIn && e.ExternalId == position.Id);

            if (existing != null)
            {
                // Update existing
                existing.Update(
                    title: position.Title,
                    company: position.CompanyName,
                    startDate: position.StartDate ?? DateTime.UtcNow,
                    endDate: position.IsCurrent ? null : position.EndDate,
                    description: position.Description,
                    location: position.Location,
                    sortOrder: existing.SortOrder
                );
                updated++;
            }
            else
            {
                // Create new
                var experience = UserExperience.CreateFromLinkedIn(
                    userId: user.Id,
                    externalId: position.Id,
                    title: position.Title,
                    company: position.CompanyName,
                    startDate: position.StartDate ?? DateTime.UtcNow,
                    endDate: position.IsCurrent ? null : position.EndDate,
                    description: position.Description,
                    location: position.Location,
                    sortOrder: user.Experiences.Count
                );
                user.Experiences.Add(experience);
                imported++;
            }
        }

        return Task.FromResult((imported, updated));
    }

    private Task<(int imported, int updated)> SyncEducationsAsync(
        User user,
        List<LinkedInEducation> educations,
        CancellationToken cancellationToken)
    {
        var imported = 0;
        var updated = 0;

        foreach (var education in educations)
        {
            // Check if education with this external ID already exists
            var existing = user.Education.FirstOrDefault(e =>
                e.Source == ProfileDataSource.LinkedIn && e.ExternalId == education.Id);

            if (existing != null)
            {
                // Update existing
                existing.Update(
                    degree: education.Degree ?? "Degree",
                    institution: education.SchoolName,
                    graduationYear: education.EndYear,
                    graduationMonth: education.EndMonth,
                    description: education.Description,
                    fieldOfStudy: education.FieldOfStudy,
                    startYear: education.StartYear,
                    startMonth: education.StartMonth,
                    sortOrder: existing.SortOrder
                );
                updated++;
            }
            else
            {
                // Create new
                var edu = UserEducation.CreateFromLinkedIn(
                    userId: user.Id,
                    externalId: education.Id,
                    degree: education.Degree ?? "Degree",
                    institution: education.SchoolName,
                    graduationYear: education.EndYear,
                    graduationMonth: education.EndMonth,
                    description: education.Description,
                    fieldOfStudy: education.FieldOfStudy,
                    startYear: education.StartYear,
                    startMonth: education.StartMonth,
                    sortOrder: user.Education.Count
                );
                user.Education.Add(edu);
                imported++;
            }
        }

        return Task.FromResult((imported, updated));
    }
}
