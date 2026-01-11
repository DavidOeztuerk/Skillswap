using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.SocialConnections;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.SocialConnections;

/// <summary>
/// Handler for getting user's imported skills
/// </summary>
public class GetUserImportedSkillsQueryHandler(
    IUserImportedSkillRepository repository,
    ILogger<GetUserImportedSkillsQueryHandler> logger)
    : BaseQueryHandler<GetUserImportedSkillsQuery, List<UserImportedSkillResponse>>(logger)
{
  private readonly IUserImportedSkillRepository _repository = repository;

  public override async Task<ApiResponse<List<UserImportedSkillResponse>>> Handle(
      GetUserImportedSkillsQuery request,
      CancellationToken cancellationToken)
  {
    Logger.LogDebug("Getting imported skills for user {UserId}", request.UserId);

    var skills = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);
    var response = skills.Select(MapToResponse).ToList();

    return Success(response);
  }

  private static UserImportedSkillResponse MapToResponse(UserImportedSkill skill)
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
