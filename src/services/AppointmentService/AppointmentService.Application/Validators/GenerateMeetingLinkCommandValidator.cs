using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class GenerateMeetingLinkCommandValidator : AbstractValidator<GenerateMeetingLinkCommand>
{
    public GenerateMeetingLinkCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");
    }
}
