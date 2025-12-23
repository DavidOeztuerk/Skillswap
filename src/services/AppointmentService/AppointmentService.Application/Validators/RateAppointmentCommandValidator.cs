using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class RateAppointmentCommandValidator : AbstractValidator<RateAppointmentCommand>
{
    public RateAppointmentCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        When(x => !string.IsNullOrEmpty(x.Feedback), () =>
        {
            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback cannot exceed 2000 characters");
        });
    }
}
