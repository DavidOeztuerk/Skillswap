using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// IMPORT SKILLS COMMAND
// ============================================================================

public record ImportSkillsCommand(
    List<SkillImportData> Skills,
    bool OverwriteExisting = false,
    bool ValidateOnly = false) : ICommand<ImportSkillsResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record SkillImportData(
    string Name,
    string Description,
    bool IsOffering,
    string CategoryName,
    string ProficiencyLevelName,
    List<string>? Tags = null);

public record ImportSkillsResponse(
    int ImportedCount,
    int SkippedCount,
    int FailedCount,
    List<string> ValidationErrors);

public class ImportSkillsCommandValidator : AbstractValidator<ImportSkillsCommand>
{
    public ImportSkillsCommandValidator()
    {
        RuleFor(x => x.Skills)
            .NotEmpty().WithMessage("Skills data is required")
            .Must(skills => skills.Count <= 500).WithMessage("Cannot import more than 500 skills at once");

        RuleForEach(x => x.Skills).SetValidator(new SkillImportDataValidator());
    }
}

public class SkillImportDataValidator : AbstractValidator<SkillImportData>
{
    public SkillImportDataValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .Length(10, 2000).WithMessage("Description must be between 10 and 2000 characters");

        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Category name is required");

        RuleFor(x => x.ProficiencyLevelName)
            .NotEmpty().WithMessage("Proficiency level name is required");
    }
}
