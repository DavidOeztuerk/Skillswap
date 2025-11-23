using Contracts.Appointment.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace AppointmentService.Application.Commands;

public record RescheduleSessionCommand(
    string SessionAppointmentId,
    string RequestedByUserId,
    DateTime ProposedDate,
    int? ProposedDurationMinutes = null,
    string? Reason = null) : ICommand<SessionStatusResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RescheduleSessionCommandValidator : AbstractValidator<RescheduleSessionCommand>
{
    public RescheduleSessionCommandValidator()
    {
        RuleFor(x => x.SessionAppointmentId)
            .NotEmpty().WithMessage("Session Appointment ID is required");

        RuleFor(x => x.RequestedByUserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ProposedDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Proposed date must be in the future");

        RuleFor(x => x.ProposedDurationMinutes)
            .GreaterThan(0).When(x => x.ProposedDurationMinutes.HasValue)
            .WithMessage("Duration must be greater than 0");

        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");
    }
}
