using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.ImportedSkill;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.ImportedSkill;

/// <summary>
/// Handler for updating an imported skill
/// </summary>
public class UpdateImportedSkillCommandHandler(
    IUserImportedSkillRepository repository,
    ILogger<UpdateImportedSkillCommandHandler> logger)
    : BaseCommandHandler<UpdateImportedSkillCommand, UserImportedSkillResponse>(logger)
{
    private readonly IUserImportedSkillRepository _repository = repository;

    public override async Task<ApiResponse<UserImportedSkillResponse>> Handle(
        UpdateImportedSkillCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Updating imported skill {SkillId} for user {UserId}",
            request.SkillId, request.UserId);

        var skill = await _repository.GetByIdAsync(request.SkillId, cancellationToken);
        if (skill == null || skill.UserId != request.UserId)
        {
            return Error("Skill not found");
        }

        // Check for duplicate name (if name changed)
        var normalizedName = request.Name.Trim().ToLowerInvariant();
        if (skill.NormalizedName != normalizedName)
        {
            var exists = await _repository.ExistsByNameAsync(request.UserId!, normalizedName, cancellationToken);
            if (exists)
            {
                return Error($"Skill '{request.Name}' already exists");
            }
        }

        skill.Update(request.Name, request.Category, request.SortOrder, request.IsVisible);
        await _repository.UpdateAsync(skill, cancellationToken);

        var response = MapToResponse(skill);
        return Success(response, "Skill updated successfully");
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
