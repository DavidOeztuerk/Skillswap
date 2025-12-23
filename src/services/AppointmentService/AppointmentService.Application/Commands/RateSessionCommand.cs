using Contracts.Appointment.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace AppointmentService.Application.Commands;

public record RateSessionCommand(
    string SessionAppointmentId,
    string RaterId,
    int Rating,
    string? Feedback = null,
    bool IsPublic = true,
    bool? WouldRecommend = null,
    string? Tags = null) : ICommand<RatingResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RateSessionCommandValidator : AbstractValidator<RateSessionCommand>
{
    public RateSessionCommandValidator()
    {
        RuleFor(x => x.SessionAppointmentId)
            .NotEmpty().WithMessage("Session Appointment ID is required");

        RuleFor(x => x.RaterId)
            .NotEmpty().WithMessage("Rater ID is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Feedback)
            .MaximumLength(2000).WithMessage("Feedback cannot exceed 2000 characters");
    }
}
