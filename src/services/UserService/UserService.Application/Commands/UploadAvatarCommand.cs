using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record UploadAvatarCommand(
    byte[] ImageData,
    string FileName,
    string ContentType)
    : ICommand<UploadAvatarResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-profile:{UserId}:*",
        "public-profile:{UserId}:*"
    };
}

public class UploadAvatarCommandValidator : AbstractValidator<UploadAvatarCommand>
{
    public UploadAvatarCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ImageData)
            .NotEmpty().WithMessage("Image data is required")
            .Must(data => data.Length <= 5 * 1024 * 1024).WithMessage("Image size must not exceed 5MB");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File name is required");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Content type is required")
            .Must(ct => ct.StartsWith("image/")).WithMessage("Only image files are allowed");
    }
}
