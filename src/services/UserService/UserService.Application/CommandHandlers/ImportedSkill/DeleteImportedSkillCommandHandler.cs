using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.ImportedSkill;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.ImportedSkill;

/// <summary>
/// Handler for deleting an imported skill
/// </summary>
public class DeleteImportedSkillCommandHandler(
    IUserImportedSkillRepository repository,
    ILogger<DeleteImportedSkillCommandHandler> logger)
    : BaseCommandHandler<DeleteImportedSkillCommand, bool>(logger)
{
  private readonly IUserImportedSkillRepository _repository = repository;

  public override async Task<ApiResponse<bool>> Handle(
      DeleteImportedSkillCommand request,
      CancellationToken cancellationToken)
  {
    Logger.LogInformation("Deleting imported skill {SkillId} for user {UserId}",
        request.SkillId, request.UserId);

    var skill = await _repository.GetByIdAsync(request.SkillId, cancellationToken);
    if (skill == null || skill.UserId != request.UserId)
    {
      return Error("Skill not found");
    }

    await _repository.DeleteAsync(skill, cancellationToken);

    return Success(true, "Skill deleted successfully");
  }
}
