using Contracts.Skill.Responses;
using SkillService.Application.Commands;
using CQRS.Handlers;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class CreateProficiencyCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<CreateProficiencyCommandHandler> logger)
    : BaseCommandHandler<CreateProficiencyLevelCommand, CreateProficiencyLevelResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CreateProficiencyLevelResponse>> Handle(CreateProficiencyLevelCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating proficiency level {LevelName}", request.Level);

        // Check if proficiency level already exists
        var existingProficiencyLevel = await _unitOfWork.ProficiencyLevels.GetByLevelAsync(request.Level, cancellationToken);

        if (existingProficiencyLevel != null)
        {
            return Error("Proficiency level already exists", ErrorCodes.ResourceAlreadyExists);
        }

        var proficiencyLevel = new ProficiencyLevel
        {
            Id = Guid.NewGuid().ToString(),
            Level = request.Level,
            Description = request.Description,
            Rank = request.Rank,
            Color = request.Color,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProficiencyLevels.CreateAsync(proficiencyLevel, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Successfully created skill category {CategoryId}", proficiencyLevel.Id);

        return Success(new CreateProficiencyLevelResponse(
            proficiencyLevel.Id,
            proficiencyLevel.Level,
            proficiencyLevel.Rank,
            proficiencyLevel.Color,
            proficiencyLevel.CreatedAt
        ));
    }
}