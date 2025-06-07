using FluentValidation;
using CQRS.Interfaces;

namespace UserService.Application.Commands;

// ============================================================================
// UPDATE USER PROFILE COMMAND
// ============================================================================

public record UpdateUserProfileCommand(
    string UserId,
    string? FirstName = null,
    string? LastName = null,
    string? PhoneNumber = null,
    string? Bio = null,
    string? TimeZone = null,
    Dictionary<string, string>? Preferences = null) 
    : ICommand<UpdateUserProfileResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateUserProfileResponse(
    string UserId,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? Bio,
    string? TimeZone,
    DateTime UpdatedAt);

public class UpdateUserProfileCommandValidator : AbstractValidator<UpdateUserProfileCommand>
{
    public UpdateUserProfileCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.FirstName)
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters")
            .Matches(@"^[a-zA-ZäöüÄÖÜß\s\-']+$").WithMessage("First name contains invalid characters")
            .When(x => !string.IsNullOrEmpty(x.FirstName));

        RuleFor(x => x.LastName)
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters")
            .Matches(@"^[a-zA-ZäöüÄÖÜß\s\-']+$").WithMessage("Last name contains invalid characters")
            .When(x => !string.IsNullOrEmpty(x.LastName));

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid phone number format")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Bio)
            .MaximumLength(1000).WithMessage("Bio must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Bio));

        RuleFor(x => x.TimeZone)
            .Must(BeValidTimeZone).WithMessage("Invalid timezone")
            .When(x => !string.IsNullOrEmpty(x.TimeZone));
    }

    private static bool BeValidTimeZone(string? timeZone)
    {
        if (string.IsNullOrEmpty(timeZone)) return true;
        
        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
