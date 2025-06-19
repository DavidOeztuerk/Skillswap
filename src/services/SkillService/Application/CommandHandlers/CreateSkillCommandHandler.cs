using MediatR;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using Events;
using SkillService.Domain.Events;

namespace SkillService.Application.CommandHandlers;

// ============================================================================
// CREATE SKILL COMMAND HANDLER
// ============================================================================

public class CreateSkillCommandHandler : BaseCommandHandler<CreateSkillCommand, CreateSkillResponse>
{
    private readonly SkillDbContext _dbContext;
    private readonly IPublisher _publisher;

    public CreateSkillCommandHandler(
        SkillDbContext dbContext,
        IPublisher publisher,
        ILogger<CreateSkillCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _publisher = publisher;
    }

    public override async Task<ApiResponse<CreateSkillResponse>> Handle(
        CreateSkillCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate category exists
            var category = await _dbContext.SkillCategories
                .FirstOrDefaultAsync(c => c.Id == request.SkillCategoryId && c.IsActive, cancellationToken);

            if (category == null)
            {
                return Error("Skill category not found or inactive");
            }

            // Validate proficiency level exists
            var proficiencyLevel = await _dbContext.ProficiencyLevels
                .FirstOrDefaultAsync(p => p.Id == request.ProficiencyLevelId && p.IsActive, cancellationToken);

            if (proficiencyLevel == null)
            {
                return Error("Proficiency level not found or inactive");
            }

            // Check for similar skills by the same user
            var existingSkill = await _dbContext.Skills
                .FirstOrDefaultAsync(s => s.UserId == request.UserId &&
                                         s.Name.ToLower() == request.Name.ToLower() &&
                                         s.IsOffering == request.IsOffering &&
                                         !s.IsDeleted, cancellationToken);

            if (existingSkill != null)
            {
                return Error("You already have a similar skill. Consider updating your existing skill instead.");
            }

            // Create new skill
            var skill = new Skill
            {
                UserId = request.UserId!,
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
                IsOffering = request.IsOffering,
                SkillCategoryId = request.SkillCategoryId,
                ProficiencyLevelId = request.ProficiencyLevelId,
                Requirements = request.Requirements?.Trim(),
                Location = request.Location?.Trim(),
                IsRemoteAvailable = request.IsRemoteAvailable,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                Tags = request.Tags ?? new List<string>(),
                IsActive = true,
                SearchKeywords = GenerateSearchKeywords(request.Name, request.Description, request.Tags),
                CreatedBy = request.UserId
            };

            _dbContext.Skills.Add(skill);

            // Update category skill count
            category.SkillCount++;
            category.ActiveSkillCount++;

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _publisher.Publish(new SkillCreatedDomainEvent(
                skill.Id,
                skill.UserId,
                skill.Name,
                skill.Description,
                skill.IsOffering,
                skill.SkillCategoryId,
                skill.ProficiencyLevelId), cancellationToken);

            // Publish integration event
            await _publisher.Publish(new SkillCreatedEvent(
                skill.Id,
                skill.Name,
                skill.Description,
                skill.IsOffering,
                skill.UserId), cancellationToken);

            Logger.LogInformation("Skill {SkillName} created successfully by user {UserId}",
                skill.Name, request.UserId);

            var response = new CreateSkillResponse(
                skill.Id,
                skill.Name,
                skill.Description,
                skill.IsOffering,
                skill.CreatedAt);

            return Success(response, "Skill created successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating skill for user {UserId}", request.UserId);
            return Error("An error occurred while creating the skill. Please try again.");
        }
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
