using Contracts.Skill.Responses;
using SkillService.Application.Commands;
using CQRS.Handlers;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class CreateSkillCategoryCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<CreateSkillCategoryCommandHandler> logger)
    : BaseCommandHandler<CreateSkillCategoryCommand, CreateSkillCategoryResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CreateSkillCategoryResponse>> Handle(CreateSkillCategoryCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating skill category {CategoryName}", request.Name);

        // Check if category already exists
        var existingCategory = await _unitOfWork.SkillCategories.GetByNameAsync(request.Name, cancellationToken);

        if (existingCategory != null)
        {
            return Error("Skill category already exists", ErrorCodes.ResourceAlreadyExists);
        }

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

        await _unitOfWork.SkillCategories.CreateAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
