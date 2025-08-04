// using Microsoft.EntityFrameworkCore;
// using CQRS.Handlers;
// using SkillService.Application.Commands;
// using EventSourcing;
// using Events.Domain.Skill;
// using Contracts.Skill.Responses;
// using SkillService.Domain.Entities;
// using CQRS.Models;

// namespace SkillService.Application.CommandHandlers;

// /// <summary>
// /// UpdateSkillCommandHandler 
// /// </summary>
// public class UpdateSkillCommandHandler(
//     SkillDbContext dbContext,
//     IDomainEventPublisher eventPublisher,
//     ILogger<UpdateSkillCommandHandler> logger)
//     : BaseCommandHandler<UpdateSkillCommand, UpdateSkillResponse>(logger)
// {
//     private readonly SkillDbContext _dbContext = dbContext;
//     private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

//     public override async Task<ApiResponse<UpdateSkillResponse>> Handle(
//         UpdateSkillCommand request,
//         CancellationToken cancellationToken)
//     {
//         try
//         {
//             // 1. Find and validate skill
//             var skill = await FindSkillAsync(request.SkillId, request.UserId ?? "", cancellationToken);
//             if (skill == null)
//             {
//                 return Error("Skill not found or you don't have permission to update it");
//             }

//             // 2. Track changes for audit
//             var changeTracker = new SkillChangeTracker();

//             // 3. Apply updates with validation
//             var updateResult = await ApplyUpdatesAsync(skill, request, changeTracker, cancellationToken);
//             if (!updateResult.IsSuccess)
//             {
//                 return Error(updateResult.ErrorMessage ?? "Failed to apply updates");
//             }

//             // 4. Save changes
//             skill.UpdatedAt = DateTime.UtcNow;
//             await _dbContext.SaveChangesAsync(cancellationToken);

//             // 5. Publish events
//             await PublishUpdateEventAsync(skill, changeTracker, cancellationToken);

//             // 6. Create response
//             var response = CreateUpdateResponse(skill);

//             Logger.LogInformation("Successfully updated skill {SkillId} with {ChangeCount} changes",
//                 skill.Id, changeTracker.Changes.Count);

//             return Success(response);
//         }
//         catch (Exception ex)
//         {
//             Logger.LogError(ex, "Failed to update skill {SkillId}", request.SkillId);
//             return Error("An error occurred while updating the skill");
//         }
//     }

//     private async Task<Skill?> FindSkillAsync(string skillId, string userId, CancellationToken cancellationToken)
//     {
//         return await _dbContext.Skills
//             .FirstOrDefaultAsync(s => s.Id == skillId &&
//                 s.UserId == userId &&
//                 !s.IsDeleted, cancellationToken);
//     }

//     private async Task<UpdateResult> ApplyUpdatesAsync(
//         Skill skill,
//         UpdateSkillCommand request,
//         SkillChangeTracker changeTracker,
//         CancellationToken cancellationToken)
//     {
//         // Basic field updates
//         UpdateBasicFields(skill, request, changeTracker);

//         // Category update with validation
//         var categoryResult = await UpdateCategoryAsync(skill, request.CategoryId, changeTracker, cancellationToken);
//         if (!categoryResult.IsSuccess)
//             return categoryResult;

//         // Proficiency level update with validation
//         var proficiencyResult = await UpdateProficiencyLevelAsync(skill, request.ProficiencyLevelId, changeTracker, cancellationToken);
//         if (!proficiencyResult.IsSuccess)
//             return proficiencyResult;

//         // Status update with side effects
//         await UpdateStatusAsync(skill, request.IsActive, changeTracker, cancellationToken);

//         return UpdateResult.Success();
//     }

//     private void UpdateBasicFields(Skill skill, UpdateSkillCommand request, SkillChangeTracker changeTracker)
//     {
//         if (!string.IsNullOrEmpty(request.Name) && request.Name != skill.Name)
//         {
//             changeTracker.RecordChange("Name", skill.Name, request.Name);
//             skill.Name = request.Name.Trim();
//         }

//         if (!string.IsNullOrEmpty(request.Description) && request.Description != skill.Description)
//         {
//             changeTracker.RecordChange("Description", "Updated");
//             skill.Description = request.Description.Trim();
//         }

//         if (request.IsOffered && request.IsOffered != skill.IsOffering)
//         {
//             changeTracker.RecordChange("IsOffering", skill.IsOffering.ToString(), request.IsOffered.ToString());
//             skill.IsOffering = request.IsOffered;
//         }

//         if (request.Tags != null)
//         {
//             changeTracker.RecordChange("Tags", "Updated");
//             skill.Tags = request.Tags;
//         }

//         if (request.AvailableHours.HasValue)
//         {
//             changeTracker.RecordChange("Duration", skill.EstimatedDurationMinutes?.ToString(), request.AvailableHours.ToString());
//             skill.EstimatedDurationMinutes = request.AvailableHours;
//         }
//     }

//     private async Task<UpdateResult> UpdateCategoryAsync(
//         Skill skill,
//         string? newCategoryId,
//         SkillChangeTracker changeTracker,
//         CancellationToken cancellationToken)
//     {
//         if (string.IsNullOrEmpty(newCategoryId) || newCategoryId == skill.SkillCategoryId)
//             return UpdateResult.Success();

//         var newCategory = await _dbContext.SkillCategories
//             .FirstOrDefaultAsync(c => c.Id == newCategoryId && c.IsActive, cancellationToken);

//         if (newCategory == null)
//             return UpdateResult.Error("New skill category not found or inactive");

//         var oldCategoryName = await GetCategoryNameAsync(skill.SkillCategoryId, cancellationToken);
//         changeTracker.RecordChange("Category", oldCategoryName, newCategory.Name);
//         skill.SkillCategoryId = newCategoryId;

//         return UpdateResult.Success();
//     }

//     private async Task<UpdateResult> UpdateProficiencyLevelAsync(
//         Skill skill,
//         string? newLevelId,
//         SkillChangeTracker changeTracker,
//         CancellationToken cancellationToken)
//     {
//         if (string.IsNullOrEmpty(newLevelId) || newLevelId == skill.ProficiencyLevelId)
//             return UpdateResult.Success();

//         var newLevel = await _dbContext.ProficiencyLevels
//             .FirstOrDefaultAsync(p => p.Id == newLevelId && p.IsActive, cancellationToken);

//         if (newLevel == null)
//             return UpdateResult.Error("New proficiency level not found or inactive");

//         changeTracker.RecordChange("ProficiencyLevel", "Updated");
//         skill.ProficiencyLevelId = newLevelId;

//         return UpdateResult.Success();
//     }

//     private async Task UpdateStatusAsync(
//         Skill skill,
//         bool? newStatus,
//         SkillChangeTracker changeTracker,
//         CancellationToken cancellationToken)
//     {
//         if (!newStatus.HasValue || newStatus.Value == skill.IsActive)
//             return;

//         var oldStatus = skill.IsActive ? "Active" : "Inactive";
//         var newStatusText = newStatus.Value ? "Active" : "Inactive";

//         changeTracker.RecordChange("Status", oldStatus, newStatusText);
//         skill.IsActive = newStatus.Value;

//         // Update category active count
//         await UpdateCategoryActiveCountAsync(skill.SkillCategoryId, newStatus.Value, cancellationToken);
//     }

//     private async Task<string?> GetCategoryNameAsync(string? categoryId, CancellationToken cancellationToken)
//     {
//         if (string.IsNullOrEmpty(categoryId))
//             return null;

//         var category = await _dbContext.SkillCategories
//             .FirstOrDefaultAsync(c => c.Id == categoryId, cancellationToken);

//         return category?.Name;
//     }

//     private async Task PublishUpdateEventAsync(Skill skill, SkillChangeTracker changeTracker, CancellationToken cancellationToken)
//     {
//         if (changeTracker.HasChanges)
//         {
//             await _eventPublisher.Publish(new SkillUpdatedDomainEvent(
//                 skill.Id,
//                 skill.UserId,
//                 skill.Name,
//                 changeTracker.Changes), cancellationToken);
//         }
//     }

//     private static UpdateSkillResponse CreateUpdateResponse(Skill skill)
//     {
//         return new UpdateSkillResponse(
//             skill.Id,
//             skill.Name,
//             skill.Description,
//             skill.SkillCategoryId,
//             skill.ProficiencyLevelId,
//             skill.Tags,
//             skill.IsOffering,
//             skill.IsPopular,
//             skill.UpdatedAt
//         );
//     }
// }

// // Helper classes for better organization
// public class SkillChangeTracker
// {
//     public Dictionary<string, string> Changes { get; } = new();
//     public bool HasChanges => Changes.Count > 0;

//     public void RecordChange(string field, string change)
//     {
//         Changes[field] = change;
//     }

//     public void RecordChange(string field, string? oldValue, string? newValue)
//     {
//         Changes[field] = $"{oldValue} -> {newValue}";
//     }
// }

// public class UpdateResult
// {
//     public bool IsSuccess { get; init; }
//     public string? ErrorMessage { get; init; }

//     public static UpdateResult Success() => new() { IsSuccess = true };
//     public static UpdateResult Error(string message) => new() { IsSuccess = false, ErrorMessage = message };
// }