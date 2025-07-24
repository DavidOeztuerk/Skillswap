// using Contracts.Skill.Responses;
// using CQRS.Interfaces;
// using FluentValidation;

// namespace SkillService.Application.Commands;

// public record BulkUpdateSkillsCommand(
//     List<string> SkillIds,
//     BulkSkillUpdateData UpdateData)
//     : ICommand<BulkUpdateSkillsResponse>, IAuditableCommand
// {
//     public string? UserId { get; set; }
//     public DateTime Timestamp { get; set; } = DateTime.UtcNow;
// }

// public record BulkSkillUpdateData(
//     bool? IsActive = null,
//     string? SkillCategoryId = null,
//     List<string>? AddTags = null,
//     List<string>? RemoveTags = null);

// public class BulkUpdateSkillsCommandValidator : AbstractValidator<BulkUpdateSkillsCommand>
// {
//     public BulkUpdateSkillsCommandValidator()
//     {
//         RuleFor(x => x.SkillIds)
//             .NotEmpty().WithMessage("Skill IDs are required")
//             .Must(ids => ids.Count <= 100).WithMessage("Cannot update more than 100 skills at once");

//         RuleFor(x => x.UpdateData)
//             .NotNull().WithMessage("Update data is required")
//             .Must(data => HasAtLeastOneUpdate(data))
//             .WithMessage("At least one update field must be specified");
//     }

//     private static bool HasAtLeastOneUpdate(BulkSkillUpdateData data)
//     {
//         return data.IsActive.HasValue ||
//                !string.IsNullOrEmpty(data.SkillCategoryId) ||
//                (data.AddTags?.Any() == true) ||
//                (data.RemoveTags?.Any() == true);
//     }
// }
