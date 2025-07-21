using FluentValidation;

namespace Contracts.Validation.Common;

/// <summary>
/// Reusable validator for email addresses
/// </summary>
public class EmailValidator : AbstractValidator<string>
{
    public EmailValidator()
    {
        RuleFor(email => email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Invalid email format")
            .MaximumLength(256)
            .WithMessage("Email must not exceed 256 characters");
    }
}

/// <summary>
/// Reusable validator for passwords with strong security requirements
/// </summary>
public class PasswordValidator : AbstractValidator<string>
{
    public PasswordValidator()
    {
        RuleFor(password => password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters long")
            .MaximumLength(100)
            .WithMessage("Password must not exceed 100 characters")
            .Must(ContainLowercase)
            .WithMessage("Password must contain at least one lowercase letter")
            .Must(ContainUppercase)
            .WithMessage("Password must contain at least one uppercase letter")
            .Must(ContainDigit)
            .WithMessage("Password must contain at least one digit")
            .Must(ContainSpecialCharacter)
            .WithMessage("Password must contain at least one special character");
    }

    private static bool ContainLowercase(string password) => password.Any(char.IsLower);
    private static bool ContainUppercase(string password) => password.Any(char.IsUpper);
    private static bool ContainDigit(string password) => password.Any(char.IsDigit);
    private static bool ContainSpecialCharacter(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}

/// <summary>
/// Reusable validator for usernames
/// </summary>
public class UsernameValidator : AbstractValidator<string>
{
    public UsernameValidator()
    {
        RuleFor(username => username)
            .NotEmpty()
            .WithMessage("Username is required")
            .MinimumLength(3)
            .WithMessage("Username must be at least 3 characters long")
            .MaximumLength(50)
            .WithMessage("Username must not exceed 50 characters")
            .Matches(@"^[a-zA-Z0-9._-]+$")
            .WithMessage("Username can only contain letters, numbers, dots, underscores, and hyphens");
    }
}

/// <summary>
/// Reusable validator for person names
/// </summary>
public class PersonNameValidator : AbstractValidator<string>
{
    public PersonNameValidator()
    {
        RuleFor(name => name)
            .NotEmpty()
            .WithMessage("Name is required")
            .MaximumLength(100)
            .WithMessage("Name must not exceed 100 characters")
            .Matches(@"^[a-zA-ZäöüÄÖÜß\s\-']+$")
            .WithMessage("Name contains invalid characters");
    }
}

/// <summary>
/// Reusable validator for phone numbers
/// </summary>
public class PhoneNumberValidator : AbstractValidator<string>
{
    public PhoneNumberValidator()
    {
        RuleFor(phone => phone)
            .NotEmpty()
            .WithMessage("Phone number is required")
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .WithMessage("Phone number must be in valid international format");
    }
}

/// <summary>
/// Reusable validator for URLs
/// </summary>
public class UrlValidator : AbstractValidator<string>
{
    public UrlValidator()
    {
        RuleFor(url => url)
            .NotEmpty()
            .WithMessage("URL is required")
            .Must(BeValidUrl)
            .WithMessage("Invalid URL format");
    }

    private static bool BeValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var result)
               && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}

/// <summary>
/// Reusable validator for GUID strings
/// </summary>
public class GuidValidator : AbstractValidator<string>
{
    public GuidValidator()
    {
        RuleFor(guid => guid)
            .NotEmpty()
            .WithMessage("ID is required")
            .Must(BeValidGuid)
            .WithMessage("Invalid ID format");
    }

    private static bool BeValidGuid(string guid)
    {
        return Guid.TryParse(guid, out _);
    }
}