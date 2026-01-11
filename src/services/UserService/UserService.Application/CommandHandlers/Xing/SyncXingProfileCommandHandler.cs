using Contracts.User.Responses.LinkedIn;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Xing;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Xing;

/// <summary>
/// Handler for syncing profile data from Xing
/// </summary>
public class SyncXingProfileCommandHandler(
    IXingService xingService,
    IUserXingConnectionRepository connectionRepository,
    IUserRepository userRepository,
    ITokenEncryptionService encryptionService,
    ILogger<SyncXingProfileCommandHandler> logger)
    : BaseCommandHandler<SyncXingProfileCommand, ProfileSyncResultResponse>(logger)
{
  private readonly IXingService _xingService = xingService;
  private readonly IUserXingConnectionRepository _connectionRepository = connectionRepository;
  private readonly IUserRepository _userRepository = userRepository;
  private readonly ITokenEncryptionService _encryptionService = encryptionService;

  public override async Task<ApiResponse<ProfileSyncResultResponse>> Handle(
      SyncXingProfileCommand request,
      CancellationToken cancellationToken)
  {
    // Get Xing connection
    var connection = await _connectionRepository.GetByUserIdAsync(request.UserId!, cancellationToken);
    if (connection == null)
    {
      return Error("Xing is not connected. Please connect Xing first.");
    }

    // Decrypt tokens
    var accessToken = _encryptionService.Decrypt(connection.AccessToken);
    var tokenSecret = _encryptionService.Decrypt(connection.TokenSecret);

    // Fetch full profile from Xing
    var profileResult = await _xingService.GetFullProfileAsync(
        accessToken, tokenSecret, cancellationToken);

    if (!profileResult.Success || profileResult.Profile == null)
    {
      connection.MarkSyncError(profileResult.Error ?? "Failed to fetch profile");
      await _connectionRepository.SaveChangesAsync(cancellationToken);
      return Error(profileResult.Error ?? "Failed to fetch Xing profile");
    }

    // Get user with experiences and educations
    var user = await _userRepository.GetByIdWithProfileAsync(request.UserId!, cancellationToken);
    if (user == null)
    {
      return Error("User not found");
    }

    // Transform and sync experiences
    var (experiencesImported, experiencesUpdated) = SyncExperiences(
        user, profileResult.Profile.ProfessionalExperience);

    // Transform and sync educations
    var (educationsImported, educationsUpdated) = SyncEducations(
        user, profileResult.Profile.EducationalBackground);

    // Save user changes
    await _userRepository.SaveChangesAsync(cancellationToken);

    // Update connection sync stats
    connection.MarkSyncSuccess(experiencesImported + experiencesUpdated, educationsImported + educationsUpdated);
    await _connectionRepository.SaveChangesAsync(cancellationToken);

    Logger.LogInformation(
        "Xing profile synced for user {UserId}: {ExpImported} experiences imported, {ExpUpdated} updated, {EduImported} educations imported, {EduUpdated} updated",
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

  private static (int imported, int updated) SyncExperiences(
      User user,
      List<XingPosition> positions)
  {
    var imported = 0;
    var updated = 0;

    foreach (var position in positions)
    {
      // Check if experience with this external ID already exists
      var existing = user.Experiences.FirstOrDefault(e =>
          e.Source == ProfileDataSource.Xing && e.ExternalId == position.Id);

      if (existing != null)
      {
        // Update existing
        existing.Update(
            title: position.Title,
            company: position.CompanyName,
            startDate: position.BeginDate ?? DateTime.UtcNow,
            endDate: position.EndDate,
            description: position.Description,
            location: position.Location,
            sortOrder: existing.SortOrder
        );
        updated++;
      }
      else
      {
        // Create new
        var experience = UserExperience.CreateFromXing(
            userId: user.Id,
            externalId: position.Id,
            title: position.Title,
            company: position.CompanyName,
            startDate: position.BeginDate ?? DateTime.UtcNow,
            endDate: position.EndDate,
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

  private static (int imported, int updated) SyncEducations(
      User user,
      List<XingEducation> educations)
  {
    var imported = 0;
    var updated = 0;

    foreach (var education in educations)
    {
      // Check if education with this external ID already exists
      var existing = user.Education.FirstOrDefault(e =>
          e.Source == ProfileDataSource.Xing && e.ExternalId == education.Id);

      if (existing != null)
      {
        // Update existing
        existing.Update(
            degree: education.Degree ?? "Degree",
            institution: education.Name,
            graduationYear: education.EndYear,
            graduationMonth: education.EndMonth,
            description: education.Notes,
            fieldOfStudy: education.Subject,
            startYear: education.BeginYear,
            startMonth: education.BeginMonth,
            sortOrder: existing.SortOrder
        );
        updated++;
      }
      else
      {
        // Create new
        var edu = UserEducation.CreateFromXing(
            userId: user.Id,
            externalId: education.Id,
            degree: education.Degree ?? "Degree",
            institution: education.Name,
            graduationYear: education.EndYear,
            graduationMonth: education.EndMonth,
            description: education.Notes,
            fieldOfStudy: education.Subject,
            startYear: education.BeginYear,
            startMonth: education.BeginMonth,
            sortOrder: user.Education.Count
        );
        user.Education.Add(edu);
        imported++;
      }
    }

    return (imported, updated);
  }
}
