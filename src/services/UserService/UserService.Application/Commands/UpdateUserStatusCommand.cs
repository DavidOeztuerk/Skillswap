using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record UpdateUserStatusCommand(
    string NewStatus,
    string? Reason = null,
    string? AdminUserId = null)
    : ICommand<UpdateUserStatusResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-profile:{UserId}:*",
        "public-profile:{UserId}:*"
    };
}

public record UpdateUserStatusResponse(
    string UserId,
    string OldStatus,
    string NewStatus,
    string? Reason,
    DateTime UpdatedAt);

public class UpdateUserStatusCommandValidator : AbstractValidator<UpdateUserStatusCommand>
{
    public UpdateUserStatusCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.NewStatus)
            .NotEmpty().WithMessage("New status is required")
            .Must(BeValidStatus).WithMessage("Invalid status");

        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }

    private static bool BeValidStatus(string? status)
    {
        if (string.IsNullOrEmpty(status)) return false;

        var validStatuses = new[] { "Active", "Inactive", "Suspended", "Banned", "PendingVerification" };
        return validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);
    }
}
