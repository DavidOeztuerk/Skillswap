using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class AcceptAppointmentCommandValidator : AbstractValidator<AcceptAppointmentCommand>
{
    public AcceptAppointmentCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
