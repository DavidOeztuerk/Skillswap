using Contracts.Skill.Responses;
using SkillService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using CQRS.Handlers;
using SkillService.Domain.Entities;
using CQRS.Models;
using Core.Common.Exceptions;

namespace SkillService.Application.CommandHandlers;

public class CreateSkillCategoryCommandHandler(
    SkillDbContext dbContext,
    IPublishEndpoint eventPublisher,
    ILogger<CreateSkillCategoryCommandHandler> logger)
    : BaseCommandHandler<CreateSkillCategoryCommand, CreateSkillCategoryResponse>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateSkillCategoryResponse>> Handle(CreateSkillCategoryCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating skill category {CategoryName}", request.Name);

        // Check if category already exists
        var existingCategory = await _dbContext.SkillCategories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == request.Name.ToLower(), cancellationToken);

        if (existingCategory != null)
        {
            return Error("Skill category already exists", ErrorCodes.ResourceAlreadyExists);
        }

        // Check parent category exists if specified
        // if (!string.IsNullOrEmpty(request.Name))
        // {
        //     var parentExists = await _dbContext.SkillCategories
        //         .AnyAsync(c => c.Name == request.Name, cancellationToken);

        //     if (!parentExists)
        //     {
        //         return Error("Parent category not found");
        //     }
        // }

        var category = new SkillCategory
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            IconName = request.IconName,
            Color = request.Color,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.SkillCategories.Add(category);
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

        Logger.LogInformation("Successfully created skill category {CategoryId}", category.Id);

        return Success(new CreateSkillCategoryResponse(
            category.Id,
            category.Name,
            category.IconName,
            category.Color,
            category.CreatedAt
        ));
    }
}
