using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.ImportedSkill;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.ImportedSkill;

/// <summary>
/// Handler for adding a new manual imported skill
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class AddImportedSkillCommandHandler(
    IUserImportedSkillRepository repository,
    ILogger<AddImportedSkillCommandHandler> logger)
    : BaseCommandHandler<AddImportedSkillCommand, UserImportedSkillResponse>(logger)
{
    private readonly IUserImportedSkillRepository _repository = repository;

    public override async Task<ApiResponse<UserImportedSkillResponse>> Handle(
        AddImportedSkillCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Adding imported skill for user {UserId}: {SkillName}",
            request.UserId, request.Name);

        // Check for duplicate
        var normalizedName = request.Name.Trim().ToLowerInvariant();
        var exists = await _repository.ExistsByNameAsync(request.UserId!, normalizedName, cancellationToken);
        if (exists)
        {
            return Error($"Skill '{request.Name}' already exists");
        }

        // Create skill
        var skill = UserImportedSkill.Create(
            request.UserId!,
            request.Name,
            request.Category,
            request.SortOrder);

        await _repository.CreateAsync(skill, cancellationToken);

        var response = MapToResponse(skill);
        return Success(response, "Skill added successfully");
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
