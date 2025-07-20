using System.ComponentModel.DataAnnotations;

namespace Contracts.Mappers;

/// <summary>
/// Validator that uses DataAnnotations attributes
/// </summary>
public class DataAnnotationsValidator<T> : AbstractValidator<T> where T : class
{
    public override ValidationResult Validate(ValidationContext<T> context)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new System.ComponentModel.DataAnnotations.ValidationContext(context.InstanceToValidate);

        var isValid = Validator.TryValidateObject(
            context.InstanceToValidate,
            validationContext,
            validationResults,
            validateAllProperties: true);

        var failures = validationResults
            .SelectMany(vr => vr.MemberNames.Select(mn => new ValidationFailure(mn, vr.ErrorMessage)))
            .ToList();

        return new ValidationResult(failures);
    }
}
