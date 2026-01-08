using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.ImportedSkill;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.ImportedSkill;

/// <summary>
/// Handler for updating skill visibility
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class UpdateImportedSkillVisibilityCommandHandler(
    IUserImportedSkillRepository repository,
    ILogger<UpdateImportedSkillVisibilityCommandHandler> logger)
    : BaseCommandHandler<UpdateImportedSkillVisibilityCommand, UserImportedSkillResponse>(logger)
{
    private readonly IUserImportedSkillRepository _repository = repository;

    public override async Task<ApiResponse<UserImportedSkillResponse>> Handle(
        UpdateImportedSkillVisibilityCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Updating visibility for skill {SkillId} to {IsVisible}",
            request.SkillId, request.IsVisible);

        var skill = await _repository.GetByIdAsync(request.SkillId, cancellationToken);
        if (skill == null || skill.UserId != request.UserId)
        {
            return Error("Skill not found");
        }

        skill.SetVisibility(request.IsVisible);
        await _repository.UpdateAsync(skill, cancellationToken);

        var response = MapToResponse(skill);
        return Success(response, "Visibility updated successfully");
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
