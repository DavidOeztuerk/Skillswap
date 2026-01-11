using Contracts.User.Responses.LinkedIn;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for syncing profile data from LinkedIn
/// </summary>
public class SyncLinkedInProfileCommandHandler(
    ILinkedInService linkedInService,
    IUserLinkedInConnectionRepository connectionRepository,
    IUserRepository userRepository,
    ITokenEncryptionService encryptionService,
    ILogger<SyncLinkedInProfileCommandHandler> logger)
    : BaseCommandHandler<SyncLinkedInProfileCommand, ProfileSyncResultResponse>(logger)
{
  private readonly ILinkedInService _linkedInService = linkedInService;
  private readonly IUserLinkedInConnectionRepository _connectionRepository = connectionRepository;
  private readonly IUserRepository _userRepository = userRepository;
  private readonly ITokenEncryptionService _encryptionService = encryptionService;

  public override async Task<ApiResponse<ProfileSyncResultResponse>> Handle(
      SyncLinkedInProfileCommand request,
      CancellationToken cancellationToken)
  {
    // Get LinkedIn connection
    var connection = await _connectionRepository.GetByUserIdAsync(request.UserId!, cancellationToken);
    if (connection == null)
    {
      return Error("LinkedIn is not connected. Please connect LinkedIn first.");
    }

    // Check if token needs refresh
    if (connection.IsTokenExpired())
    {
      var refreshResult = await RefreshTokenIfNeededAsync(connection, cancellationToken);
      if (!refreshResult)
      {
        connection.MarkSyncError("Token expired and refresh failed");
        await _connectionRepository.SaveChangesAsync(cancellationToken);
        return Error("LinkedIn token expired. Please reconnect your LinkedIn account.");
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
      return Error(profileResult.Error ?? "Failed to fetch LinkedIn profile");
    }

    // Get user with experiences and educations
    var user = await _userRepository.GetByIdWithProfileAsync(request.UserId!, cancellationToken);
    if (user == null)
    {
      return Error("User not found");
    }

    // Transform and sync experiences
    var (experiencesImported, experiencesUpdated) = SyncExperiences(user, profileResult.Profile.Positions);

    // Transform and sync educations
    var (educationsImported, educationsUpdated) = SyncEducations(user, profileResult.Profile.Educations);

    // Save user changes
    await _userRepository.SaveChangesAsync(cancellationToken);

    // Update connection sync stats
    connection.MarkSyncSuccess(experiencesImported + experiencesUpdated, educationsImported + educationsUpdated);
    await _connectionRepository.SaveChangesAsync(cancellationToken);

    Logger.LogInformation(
        "LinkedIn profile synced for user {UserId}: {ExpImported} experiences imported, {ExpUpdated} updated, {EduImported} educations imported, {EduUpdated} updated",
        request.UserId, experiencesImported, experiencesUpdated, educationsImported, educationsUpdated);

    return Success(
        new ProfileSyncResultResponse(
            ExperiencesImported: experiencesImported,
            ExperiencesUpdated: experiencesUpdated,
            EducationsImported: educationsImported,
            EducationsUpdated: educationsUpdated,
            SyncedAt: DateTime.UtcNow
        ),
        "Profile synced successfully");
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
      Logger.LogWarning(ex, "Failed to refresh LinkedIn token for connection {ConnectionId}", connection.Id);
    }

    return false;
  }

  private static (int imported, int updated) SyncExperiences(User user, List<LinkedInPosition> positions)
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

    return (imported, updated);
  }

  private static (int imported, int updated) SyncEducations(User user, List<LinkedInEducation> educations)
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

    return (imported, updated);
  }
}
