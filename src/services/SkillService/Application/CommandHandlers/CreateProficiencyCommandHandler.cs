using Contracts.Skill.Responses;
using SkillService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Domain.Entities;

namespace SkillService.Application.CommandHandlers;

public class CreateProficiencyCommandHandler(
    SkillDbContext dbContext,
    IPublishEndpoint eventPublisher,
    ILogger<CreateProficiencyCommandHandler> logger)
    : BaseCommandHandler<CreateProficiencyLevelCommand, CreateProficiencyLevelResponse>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateProficiencyLevelResponse>> Handle(CreateProficiencyLevelCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating skill category {CategoryName}", request.Level);

        // Check if proficiencylevel already exists
        var existingCategory = await _dbContext.ProficiencyLevels
            .FirstOrDefaultAsync(c => c.Level.ToLower() == request.Level.ToLower(), cancellationToken);

        if (existingCategory != null)
        {
            return Error("Skill category already exists");
        }

        // Check parent category exists if specified
        // if (!string.IsNullOrEmpty(request.Level))
        // {
        //     var parentExists = await _dbContext.ProficiencyLevels
        //         .AnyAsync(c => c.Level == request.Level, cancellationToken);

        //     if (!parentExists)
        //     {
        //         return Error("Parent category not found");
        //     }
        // }

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

        _dbContext.ProficiencyLevels.Add(proficiencyLevel);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish domain event
        // await _eventPublisher.Publish(new SkillCategoryCreatedEvent
        // {
        //     CategoryId = category.Id,
        //     Name = category.Name,
        //     Description = category.Description,
        //     ParentCategoryId = category.ParentCategoryId,
        //     CreatedBy = request.CreatedBy,
        //     Timestamp = DateTime.UtcNow
        // }, cancellationToken);

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