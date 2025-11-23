using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class CreateSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<CreateSkillCommandHandler> logger)
    : BaseCommandHandler<CreateSkillCommand, CreateSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CreateSkillResponse>> Handle(
        CreateSkillCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == null)
        {
            throw new ArgumentNullException(nameof(request), "UserId cannot be null when creating a skill.");
        }

        // Validate category exists
        var category = await _unitOfWork.SkillCategories.GetByIdAsync(request.CategoryId, cancellationToken) ?? throw new ResourceNotFoundException("SkillCategory", request.CategoryId);

        // Validate proficiency level exists
        var proficiencyLevel = await _unitOfWork.ProficiencyLevels.GetByIdAsync(request.ProficiencyLevelId, cancellationToken) ?? throw new ResourceNotFoundException("ProficiencyLevel", request.ProficiencyLevelId);

        // Check for similar skills by the same user
        var existingSkill = await _unitOfWork.Skills.GetByNameAndUserIdAsync(request.Name.Trim(), request.UserId, cancellationToken);

        if (existingSkill != null)
        {
            throw new ResourceAlreadyExistsException(
                "Skill", 
                "Name", 
                request.Name, 
                "You already have a similar skill. Consider updating your existing skill instead.");
        }

        // Create new skill
        var skill = new Skill
        {
            UserId = request.UserId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            IsOffered = request.IsOffered,
            SkillCategoryId = request.CategoryId,
            ProficiencyLevelId = request.ProficiencyLevelId,
            Tags = request.Tags ?? new List<string>(),
            IsActive = true,
            SearchKeywords = GenerateSearchKeywords(request.Name, request.Description, request.Tags),
            CreatedBy = request.UserId
        };

        await _unitOfWork.Skills.CreateAsync(skill, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Skill {SkillName} created successfully by user {UserId}",
            skill.Name, request.UserId);

        var response = new CreateSkillResponse(
            skill.Id,
            skill.Name,
            skill.Description,
            category.Id,
            proficiencyLevel.Id,
            skill.Tags,
            skill.IsOffered,
            "Active",
            skill.CreatedAt);

        return Success(response, "Skill created successfully");
    }

    private static string GenerateSearchKeywords(string name, string description, List<string>? tags)
    {
        var keywords = new List<string> { name };

        // Add significant words from description
        var descriptionWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Take(10);
        keywords.AddRange(descriptionWords);

        // Add tags
        if (tags != null)
        {
            keywords.AddRange(tags);
        }

        return string.Join(" ", keywords.Distinct()).ToLowerInvariant();
    }
}
