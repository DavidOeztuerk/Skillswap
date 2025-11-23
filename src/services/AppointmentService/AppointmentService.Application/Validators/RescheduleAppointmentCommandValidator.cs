using AppointmentService.Application.Commands;
using FluentValidation;

namespace AppointmentService.Application.Validators;

public class RescheduleAppointmentCommandValidator : AbstractValidator<RescheduleAppointmentCommand>
{
    public RescheduleAppointmentCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required")
            .Must(BeAValidGuid).WithMessage("Appointment ID must be a valid GUID");

        RuleFor(x => x.NewScheduledDate)
            .NotEmpty().WithMessage("New scheduled date is required")
            .Must(BeInFuture).WithMessage("New scheduled date must be in the future")
            .Must(NotBeTooFarInFuture).WithMessage("Cannot schedule appointments more than 6 months in advance");

        RuleFor(x => x.NewDurationMinutes)
            .InclusiveBetween(15, 480)
            .When(x => x.NewDurationMinutes.HasValue)
            .WithMessage("Duration must be between 15 and 480 minutes");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required")
            .Must(BeAValidGuid).WithMessage("User ID must be a valid GUID");
    }

    private bool BeAValidGuid(string? id)
    {
        return !string.IsNullOrEmpty(id) && Guid.TryParse(id, out _);
    }

    private bool BeInFuture(DateTimeOffset date)
    {
        return date > DateTimeOffset.UtcNow.AddMinutes(5); // Allow 5 minutes buffer
    }

    private bool NotBeTooFarInFuture(DateTimeOffset date)
    {
        return date <= DateTimeOffset.UtcNow.AddMonths(6);
    }
}