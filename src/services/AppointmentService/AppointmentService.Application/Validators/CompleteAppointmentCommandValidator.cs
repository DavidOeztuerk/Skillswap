using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class CompleteAppointmentCommandValidator : AbstractValidator<CompleteAppointmentCommand>
{
    public CompleteAppointmentCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");

        RuleFor(x => x.SessionDurationMinutes)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0 minutes")
            .LessThanOrEqualTo(600).WithMessage("Session duration cannot exceed 10 hours (600 minutes)");

        When(x => x.Rating.HasValue, () =>
        {
            RuleFor(x => x.Rating!.Value)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");
        });

        When(x => !string.IsNullOrEmpty(x.Feedback), () =>
        {
            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback cannot exceed 2000 characters");
        });
    }
}
