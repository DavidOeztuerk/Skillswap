using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;

namespace SkillService.Application.CommandHandlers;

public class CreateSkillCommandHandler(
    SkillDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateSkillCommandHandler> logger)
    : BaseCommandHandler<CreateSkillCommand, CreateSkillResponse>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateSkillResponse>> Handle(
        CreateSkillCommand request,
        CancellationToken cancellationToken)
    {
        // Validate category exists
        var category = await _dbContext.SkillCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (category == null)
        {
            throw new ResourceNotFoundException("SkillCategory", request.CategoryId);
        }

        // Validate proficiency level exists
        var proficiencyLevel = await _dbContext.ProficiencyLevels
            .FirstOrDefaultAsync(p => p.Id == request.ProficiencyLevelId && p.IsActive, cancellationToken);

        if (proficiencyLevel == null)
        {
            throw new ResourceNotFoundException("ProficiencyLevel", request.ProficiencyLevelId);
        }

        // Check for similar skills by the same user
        var existingSkill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.UserId == request.UserId &&
                                     s.Name.ToLower() == request.Name.ToLower() &&
                                     s.IsOffered == request.IsOffered &&
                                     !s.IsDeleted, cancellationToken);

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
            UserId = request.UserId!,
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

        _dbContext.Skills.Add(skill);

        await _dbContext.SaveChangesAsync(cancellationToken);

        // ✅ NUR HIER Domain Event publizieren - NICHT im Event Handler!
        await _eventPublisher.Publish(new SkillCreatedDomainEvent(
            skill.Id,
            skill.UserId,
            skill.Name,
            skill.Description,
            skill.IsOffered,
            skill.SkillCategoryId,
            skill.ProficiencyLevelId), cancellationToken);

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
