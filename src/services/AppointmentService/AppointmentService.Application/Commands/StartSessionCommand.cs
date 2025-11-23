using Contracts.Appointment.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace AppointmentService.Application.Commands;

public record StartSessionCommand(
    string SessionAppointmentId,
    string UserId) : ICommand<SessionStatusResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-appointments:*",
        "appointment-details:*"
    };
}

public class StartSessionCommandValidator : AbstractValidator<StartSessionCommand>
{
    public StartSessionCommandValidator()
    {
        RuleFor(x => x.SessionAppointmentId)
            .NotEmpty().WithMessage("Session Appointment ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
