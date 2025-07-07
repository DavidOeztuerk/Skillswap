using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record UpdateUserAvailabilityCommand(
    string UserId,
    List<WeeklyAvailability> WeeklySchedule,
    string? TimeZone = null,
    List<DateRange>? BlockedDates = null)
    : ICommand<UpdateUserAvailabilityResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateUserAvailabilityResponse(
    string UserId,
    List<WeeklyAvailability> WeeklySchedule,
    string? TimeZone,
    DateTime UpdatedAt);

public class UpdateUserAvailabilityCommandValidator : AbstractValidator<UpdateUserAvailabilityCommand>
{
    public UpdateUserAvailabilityCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
        
        RuleFor(x => x.WeeklySchedule)
            .NotNull().WithMessage("Weekly schedule is required");
        
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
