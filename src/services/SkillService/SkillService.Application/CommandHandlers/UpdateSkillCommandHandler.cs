using CQRS.Handlers;
using SkillService.Application.Commands;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class UpdateSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<UpdateSkillCommandHandler> logger) 
    : BaseCommandHandler<UpdateSkillCommand, UpdateSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<UpdateSkillResponse>> Handle(
        UpdateSkillCommand request,
        CancellationToken cancellationToken)
    {
        var skill = await _unitOfWork.Skills
            .GetByIdAndUserIdAsync(request.SkillId, request.UserId!, includeDeleted: false, cancellationToken);

        if (skill == null)
        {
            throw new ResourceNotFoundException("Skill", request.SkillId);
        }

            var changedFields = new Dictionary<string, string>();

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.Name) && request.Name != skill.Name)
            {
                changedFields["Name"] = $"{skill.Name} -> {request.Name}";
                skill.Name = request.Name.Trim();
            }

            if (!string.IsNullOrEmpty(request.Description) && request.Description != skill.Description)
            {
                changedFields["Description"] = "Updated";
                skill.Description = request.Description.Trim();
            }

            if (request.IsOffered && request.IsOffered != skill.IsOffered)
            {
                changedFields["IsOffering"] = $"{skill.IsOffered} -> {request.IsOffered}";
                skill.IsOffered = request.IsOffered;
            }

            if (!string.IsNullOrEmpty(request.CategoryId) && request.CategoryId != skill.SkillCategoryId)
            {
                // Validate new category
                var newCategory = await _unitOfWork.SkillCategories
                    .GetByIdAsync(request.CategoryId, cancellationToken);

                if (newCategory == null || !newCategory.IsActive)
                {
                    throw new ResourceNotFoundException("SkillCategory", request.CategoryId);
                }

                // Update category counts
                var oldCategory = await _unitOfWork.SkillCategories
                    .GetByIdAsync(skill.SkillCategoryId, cancellationToken);


                changedFields["Category"] = $"{oldCategory?.Name} -> {newCategory.Name}";
                skill.SkillCategoryId = request.CategoryId;
            }

            if (!string.IsNullOrEmpty(request.ProficiencyLevelId) && request.ProficiencyLevelId != skill.ProficiencyLevelId)
            {
                // Validate new proficiency level
                var newLevel = await _unitOfWork.ProficiencyLevels
                    .GetByIdAsync(request.ProficiencyLevelId, cancellationToken);

                if (newLevel == null || !newLevel.IsActive)
                {
                    throw new ResourceNotFoundException("ProficiencyLevel", request.ProficiencyLevelId);
                }

                changedFields["ProficiencyLevel"] = "Updated";
                skill.ProficiencyLevelId = request.ProficiencyLevelId;
            }

            if (request.Tags != null)
            {
                changedFields["Tags"] = "Updated";
                skill.Tags = request.Tags;
            }

            if (request.AvailableHours.HasValue)
            {
                changedFields["Duration"] = $"{skill.EstimatedDurationMinutes} -> {request.AvailableHours}";
                skill.EstimatedDurationMinutes = request.AvailableHours;
            }

            if (request.IsActive.HasValue && request.IsActive.Value != skill.IsActive)
            {
                changedFields["Status"] = $"{(skill.IsActive ? "Active" : "Inactive")} -> {(request.IsActive.Value ? "Active" : "Inactive")}";
                skill.IsActive = request.IsActive.Value;

                // Update category active count (if needed in the future)
                var category = await _unitOfWork.SkillCategories
                    .GetByIdAsync(skill.SkillCategoryId, cancellationToken);

            }

            if (!changedFields.Any())
            {
                throw new Core.Common.Exceptions.InvalidOperationException(
                    "UpdateSkill", 
                    "No changes provided", 
                    "At least one field must be updated");
            }

            // Update search keywords if name or description changed
            if (changedFields.ContainsKey("Name") || changedFields.ContainsKey("Description") || changedFields.ContainsKey("Tags"))
            {
                skill.SearchKeywords = GenerateSearchKeywords(skill.Name, skill.Description, skill.Tags);
            }

            skill.UpdatedAt = DateTime.UtcNow;
            skill.UpdatedBy = request.UserId;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Skill {SkillId} updated successfully by user {UserId} with changes: {Changes}",
                skill.Id, request.UserId, string.Join(", ", changedFields.Keys));

            var response = new UpdateSkillResponse(
                skill.Id,
                skill.Name,
                skill.Description,
                skill.SkillCategoryId,
                skill.ProficiencyLevelId,
                skill.Tags,
                skill.IsOffered,
                skill.IsActive,
                skill.UpdatedAt.Value);

            return Success(response, "Skill updated successfully");
    }

    private static string GenerateSearchKeywords(string name, string description, List<string> tags)
    {
        var keywords = new List<string> { name };

        var descriptionWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Take(10);
        keywords.AddRange(descriptionWords);
        keywords.AddRange(tags);

        return string.Join(" ", keywords.Distinct()).ToLowerInvariant();
    }
}
