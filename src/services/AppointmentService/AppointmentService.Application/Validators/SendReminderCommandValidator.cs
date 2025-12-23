using FluentValidation;
using AppointmentService.Application.Commands;

namespace AppointmentService.Application.Validators;

public class SendReminderCommandValidator : AbstractValidator<SendReminderCommand>
{
    public SendReminderCommandValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("Appointment ID is required");
    }
}
