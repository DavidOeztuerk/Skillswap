using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class CancelAppointmentCommandValidator : AbstractValidator<CancelAppointmentCommand>
{
    public CancelAppointmentCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        When(x => !string.IsNullOrEmpty(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Cancellation reason cannot exceed 500 characters");
        });
    }
}
