using Contracts.User.Responses;
using Contracts.User.Responses.LinkedIn;
using Contracts.User.Responses.Xing;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.SocialConnections;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.SocialConnections;

/// <summary>
/// Handler for getting all social connections and imported data
/// </summary>
public class GetSocialConnectionsQueryHandler(
    IUserLinkedInConnectionRepository linkedInRepository,
    IUserXingConnectionRepository xingRepository,
    IUserImportedSkillRepository skillRepository,
    IUserExperienceRepository experienceRepository,
    IUserEducationRepository educationRepository,
    ILogger<GetSocialConnectionsQueryHandler> logger)
    : BaseQueryHandler<GetSocialConnectionsQuery, SocialConnectionsResponse>(logger)
{
  private readonly IUserLinkedInConnectionRepository _linkedInRepository = linkedInRepository;
  private readonly IUserXingConnectionRepository _xingRepository = xingRepository;
  private readonly IUserImportedSkillRepository _skillRepository = skillRepository;
  private readonly IUserExperienceRepository _experienceRepository = experienceRepository;
  private readonly IUserEducationRepository _educationRepository = educationRepository;

  public override async Task<ApiResponse<SocialConnectionsResponse>> Handle(
      GetSocialConnectionsQuery request,
      CancellationToken cancellationToken)
  {
    Logger.LogDebug("Getting social connections for user {UserId}", request.UserId);

    // NOTE: EF Core DbContext is NOT thread-safe, so we must execute sequentially
    // All repositories share the same scoped DbContext instance
    var linkedIn = await _linkedInRepository.GetByUserIdAsync(request.UserId, cancellationToken);
    var xing = await _xingRepository.GetByUserIdAsync(request.UserId, cancellationToken);
    var skills = await _skillRepository.GetByUserIdAsync(request.UserId, cancellationToken);
    var experiences = await _experienceRepository.GetUserExperiences(request.UserId, cancellationToken);
    var educations = await _educationRepository.GetUserEducation(request.UserId, cancellationToken);

    // Map responses
    var linkedInResponse = linkedIn != null ? MapLinkedInConnection(linkedIn) : null;
    var xingResponse = xing != null ? MapXingConnection(xing) : null;
    var skillResponses = skills.Select(MapSkill).ToList();

    // Calculate summary
    var linkedInSkillCount = skills.Count(s => s.Source == ProfileDataSource.LinkedIn);
    var xingSkillCount = skills.Count(s => s.Source == ProfileDataSource.Xing);
    var manualSkillCount = skills.Count(s => s.Source == ProfileDataSource.Manual);

    var linkedInExpCount = experiences.Count(e => e.Source == ProfileDataSource.LinkedIn);
    var xingExpCount = experiences.Count(e => e.Source == ProfileDataSource.Xing);

    var linkedInEduCount = educations.Count(e => e.Source == ProfileDataSource.LinkedIn);
    var xingEduCount = educations.Count(e => e.Source == ProfileDataSource.Xing);

    var summary = new SocialConnectionsSummary(
        TotalImportedSkills: skills.Count,
        LinkedInSkillCount: linkedInSkillCount,
        XingSkillCount: xingSkillCount,
        ManualSkillCount: manualSkillCount,
        TotalImportedExperiences: linkedInExpCount + xingExpCount,
        TotalImportedEducations: linkedInEduCount + xingEduCount,
        HasLinkedInConnection: linkedIn != null,
        HasXingConnection: xing != null);

    var response = new SocialConnectionsResponse(
        linkedInResponse,
        xingResponse,
        skillResponses,
        summary);

    return Success(response);
  }

  private static LinkedInConnectionResponse MapLinkedInConnection(UserLinkedInConnection connection)
  {
    return new LinkedInConnectionResponse(
        connection.Id,
        connection.LinkedInId,
        connection.ProfileUrl,
        connection.LinkedInEmail,
        connection.IsVerified,
        connection.VerifiedAt,
        connection.LastSyncAt,
        connection.ImportedExperienceCount,
        connection.ImportedEducationCount,
        connection.AutoSyncEnabled,
        connection.CreatedAt);
  }

  private static XingConnectionResponse MapXingConnection(UserXingConnection connection)
  {
    return new XingConnectionResponse(
        connection.Id,
        connection.XingId,
        connection.ProfileUrl,
        connection.XingEmail,
        connection.IsVerified,
        connection.VerifiedAt,
        connection.LastSyncAt,
        connection.ImportedExperienceCount,
        connection.ImportedEducationCount,
        connection.AutoSyncEnabled,
        connection.CreatedAt);
  }

  private static UserImportedSkillResponse MapSkill(UserImportedSkill skill)
  {
    return new UserImportedSkillResponse(
        skill.Id,
        skill.Name,
        skill.Source,
        skill.ExternalId,
        skill.EndorsementCount,
        skill.Category,
        skill.SortOrder,
        skill.IsVisible,
        skill.ImportedAt,
        skill.LastSyncAt,
        skill.CreatedAt);
  }
}
