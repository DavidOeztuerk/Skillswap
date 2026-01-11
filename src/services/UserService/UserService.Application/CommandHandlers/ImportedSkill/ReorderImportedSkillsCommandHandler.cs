using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.ImportedSkill;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.ImportedSkill;

/// <summary>
/// Handler for reordering imported skills
/// </summary>
public class ReorderImportedSkillsCommandHandler(
    IUserImportedSkillRepository repository,
    ILogger<ReorderImportedSkillsCommandHandler> logger)
    : BaseCommandHandler<ReorderImportedSkillsCommand, bool>(logger)
{
  private readonly IUserImportedSkillRepository _repository = repository;

  public override async Task<ApiResponse<bool>> Handle(
      ReorderImportedSkillsCommand request,
      CancellationToken cancellationToken)
  {
    Logger.LogInformation("Reordering {Count} skills for user {UserId}",
        request.Skills.Count, request.UserId);

    foreach (var item in request.Skills)
    {
      var skill = await _repository.GetByIdAsync(item.SkillId, cancellationToken);
      if (skill == null || skill.UserId != request.UserId)
      {
        Logger.LogWarning("Skill {SkillId} not found or doesn't belong to user", item.SkillId);
        continue;
      }

      skill.SetSortOrder(item.SortOrder);
    }

    await _repository.SaveChangesAsync(cancellationToken);

    return Success(true, "Skills reordered successfully");
  }
}
