using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Commands;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;

namespace SkillService.Application.CommandHandlers;

public class UpdateSkillCommandHandler : BaseCommandHandler<UpdateSkillCommand, UpdateSkillResponse>
{
    private readonly SkillDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;

    public UpdateSkillCommandHandler(
        SkillDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        ILogger<UpdateSkillCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
    }

    public override async Task<ApiResponse<UpdateSkillResponse>> Handle(
        UpdateSkillCommand request,
        CancellationToken cancellationToken)
    {
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == request.SkillId &&
                                     s.UserId == request.UserId &&
                                     !s.IsDeleted, cancellationToken);

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
                var newCategory = await _dbContext.SkillCategories
                    .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

                if (newCategory == null)
                {
                    throw new ResourceNotFoundException("SkillCategory", request.CategoryId);
                }

                // Update category counts
                var oldCategory = await _dbContext.SkillCategories
                    .FirstOrDefaultAsync(c => c.Id == skill.SkillCategoryId, cancellationToken);


                changedFields["Category"] = $"{oldCategory?.Name} -> {newCategory.Name}";
                skill.SkillCategoryId = request.CategoryId;
            }

            if (!string.IsNullOrEmpty(request.ProficiencyLevelId) && request.ProficiencyLevelId != skill.ProficiencyLevelId)
            {
                // Validate new proficiency level
                var newLevel = await _dbContext.ProficiencyLevels
                    .FirstOrDefaultAsync(p => p.Id == request.ProficiencyLevelId && p.IsActive, cancellationToken);

                if (newLevel == null)
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

            //if (!string.IsNullOrEmpty(request.Requirements))
            //{
            //    changedFields["Requirements"] = "Updated";
            //    skill.Requirements = request.Requirements.Trim();
            //}

            //if (request.IsRemoteAvailable.HasValue)
            //{
            //    changedFields["RemoteAvailability"] = $"{skill.IsRemoteAvailable} -> {request.IsRemoteAvailable}";
            //    skill.IsRemoteAvailable = request.IsRemoteAvailable.Value;
            //}

            if (request.IsActive.HasValue && request.IsActive.Value != skill.IsActive)
            {
                changedFields["Status"] = $"{(skill.IsActive ? "Active" : "Inactive")} -> {(request.IsActive.Value ? "Active" : "Inactive")}";
                skill.IsActive = request.IsActive.Value;

                // Update category active count
                var category = await _dbContext.SkillCategories
                    .FirstOrDefaultAsync(c => c.Id == skill.SkillCategoryId, cancellationToken);

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

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new SkillUpdatedDomainEvent(
                skill.Id,
                skill.UserId,
                skill.Name,
                changedFields), cancellationToken);

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
