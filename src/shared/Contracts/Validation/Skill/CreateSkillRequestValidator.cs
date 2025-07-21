using FluentValidation;
using Contracts.Skill.Requests;

namespace Contracts.Validation.Skill;

/// <summary>
/// Validator for create skill requests
/// </summary>
public class CreateSkillRequestValidator : AbstractValidator<CreateSkillRequest>
{
    public CreateSkillRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Skill name is required")
            .MaximumLength(100)
            .WithMessage("Skill name must not exceed 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-_\.]+$")
            .WithMessage("Skill name contains invalid characters");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Skill description is required")
            .MaximumLength(1000)
            .WithMessage("Description must not exceed 1000 characters");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("Category is required")
            .Must(BeValidGuid)
            .WithMessage("Invalid category ID format");

        RuleFor(x => x.ProficiencyLevelId)
            .IsInEnum()
            .WithMessage("Invalid proficiency level");

        RuleFor(x => x.Tags)
            .Must(HaveValidTags)
            .WithMessage("Tags must not be empty and each tag must be 1-50 characters")
            .When(x => x.Tags != null && x.Tags.Any());

        RuleFor(x => x.IsOffered)
            .NotNull()
            .WithMessage("Offering status must be specified");

        //RuleFor(x => x.isle)
        //    .NotNull()
        //    .WithMessage("Learning status must be specified");

        //RuleFor(x => x)
        //    .Must(x => x.IsOffering || x.IsLearning)
        //    .WithMessage("Skill must be either offered or being learned (or both)");
    }

    private static bool BeValidGuid(string guid)
    {
        return Guid.TryParse(guid, out _);
    }

    private static bool HaveValidTags(IEnumerable<string> tags)
    {
        return tags.All(tag => !string.IsNullOrWhiteSpace(tag) && tag.Length <= 50);
    }
}