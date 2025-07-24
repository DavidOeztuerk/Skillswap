// using Contracts.Skill.Responses;
// using SkillService.Application.Commands;
// using Microsoft.EntityFrameworkCore;
// using MassTransit;
// using CQRS.Handlers;
// using Infrastructure.Models;

// namespace SkillService.Application.CommandHandlers;

// public class BulkUpdateSkillsCommandHandler(
//     SkillDbContext dbContext,
//     IPublishEndpoint eventPublisher,
//     ILogger<BulkUpdateSkillsCommandHandler> logger) 
//     : BaseCommandHandler<BulkUpdateSkillsCommand, BulkUpdateSkillsResponse>(logger)
// {
//     private readonly SkillDbContext _dbContext = dbContext;
//     private readonly IPublishEndpoint _eventPublisher = eventPublisher;

//     public override async Task<ApiResponse<BulkUpdateSkillsResponse>> Handle(BulkUpdateSkillsCommand request, CancellationToken cancellationToken)
//     {
//         Logger.LogInformation("Bulk updating {Count} skills for user {UserId}", request.SkillIds, request.UserId);

//         var skillIds = request.SkillIds.Select(u => u).ToList();
//         var skills = await _dbContext.Skills
//             .Where(s => skillIds.Contains(s.Id) && s.UserId == request.UserId)
//             .ToListAsync(cancellationToken);

//         if (skills.Count != skillIds.Count)
//         {
//             return Error("Some skills not found or not owned by user");
//         }

//         var updatedSkills = new List<string>();
//         var failedUpdates = new List<string>();

//         using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

//         try
//         {
//             foreach (var updateRequest in request.SkillIds)
//             {
//                 var skill = skills.FirstOrDefault(s => s.Id == updateRequest);
//                 if (skill == null)
//                 {
//                     failedUpdates.Add(updateRequest);
//                     continue;
//                 }

//                 // Update skill properties
//                 if (!string.IsNullOrEmpty(updateRequest.Name))
//                     skill.Name = updateRequest.Name;

//                 if (!string.IsNullOrEmpty(updateRequest.Description))
//                     skill.Description = updateRequest.Description;

//                 if (!string.IsNullOrEmpty(updateRequest.CategoryId))
//                     skill.CategoryId = updateRequest.CategoryId;

//                 if (updateRequest.ProficiencyLevel.HasValue)
//                     skill.ProficiencyLevel = updateRequest.ProficiencyLevel.Value;

//                 skill.UpdatedAt = DateTime.UtcNow;
//                 updatedSkills.Add(skill.Id);
//             }

//             await _dbContext.SaveChangesAsync(cancellationToken);
//             await transaction.CommitAsync(cancellationToken);

//             // Publish bulk update event
//             await _eventPublisher.Publish(new SkillsBulkUpdatedEvent
//             {
//                 UserId = request.UserId,
//                 UpdatedSkillIds = updatedSkills,
//                 FailedSkillIds = failedUpdates,
//                 Timestamp = DateTime.UtcNow
//             }, cancellationToken);

//             Logger.LogInformation("Successfully bulk updated {UpdatedCount} skills, {FailedCount} failed",
//                 updatedSkills.Count, failedUpdates.Count);

//             return Success(new BulkUpdateSkillsResponse(
//                 updatedSkills.Count,
//                 failedUpdates.Count,
//                 updatedSkills,
//                 failedUpdates
//             ));
//         }
//         catch (Exception ex)
//         {
//             await transaction.RollbackAsync(cancellationToken);
//             Logger.LogError(ex, "Failed to bulk update skills for user {UserId}", request.UserId);
//             return Error("Bulk update failed");
//         }
//     }
// }