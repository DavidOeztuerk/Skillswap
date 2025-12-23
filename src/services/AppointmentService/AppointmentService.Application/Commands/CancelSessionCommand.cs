using Contracts.Appointment.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace AppointmentService.Application.Commands;

public record CancelSessionCommand(
    string SessionAppointmentId,
    string CancelledByUserId,
    string Reason) : ICommand<SessionStatusResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-appointments:*",
        "appointment-details:*"
    };
}

public class CancelSessionCommandValidator : AbstractValidator<CancelSessionCommand>
{
    public CancelSessionCommandValidator()
    {
        RuleFor(x => x.SessionAppointmentId)
            .NotEmpty().WithMessage("Session Appointment ID is required");

        RuleFor(x => x.CancelledByUserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required")
            .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");
    }
}
