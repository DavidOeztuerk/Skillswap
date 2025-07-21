//using FluentValidation;
//using FluentValidation.Results;
//using System.ComponentModel.DataAnnotations;

//namespace Contracts.Mappers;

///// <summary>
///// Validator that uses DataAnnotations attributes
///// </summary>
//public class DataAnnotationsValidator<T> : AbstractValidator<T> where T : class
//{
//    public override FluentValidation.Results.ValidationResult Validate(ValidationContext<T> context, List<ValidationFailure> failures)
//    {
//        var validationResults = new List<FluentValidation.Results.ValidationResult>();
//        var validationContext = new ValidationContext(context.InstanceToValidate);

//        var isValid = Validator.TryValidateObject(
//            context.InstanceToValidate,
//            validationContext,
//            validationResults,
//            validateAllProperties: true);

//        var failures = validationResults
//            .SelectMany(vr => vr.MemberNames.Select(mn => new ValidationFailure(mn, vr.ErrorMessage)))
//            .ToList();

//        return new System.ComponentModel.DataAnnotations.ValidationResult(failures);
//    }
//}
