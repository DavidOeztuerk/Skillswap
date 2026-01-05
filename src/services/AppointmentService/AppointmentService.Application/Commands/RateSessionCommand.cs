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
    string? Tags = null,
    // Section Ratings (1-5 each, optional)
    int? KnowledgeRating = null,
    string? KnowledgeComment = null,
    int? TeachingRating = null,
    string? TeachingComment = null,
    int? CommunicationRating = null,
    string? CommunicationComment = null,
    int? ReliabilityRating = null,
    string? ReliabilityComment = null) : ICommand<RatingResponse>, IAuditableCommand
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

        // Section rating validations
        RuleFor(x => x.KnowledgeRating)
            .InclusiveBetween(1, 5).When(x => x.KnowledgeRating.HasValue)
            .WithMessage("Knowledge rating must be between 1 and 5");

        RuleFor(x => x.KnowledgeComment)
            .MaximumLength(500).WithMessage("Knowledge comment cannot exceed 500 characters");

        RuleFor(x => x.TeachingRating)
            .InclusiveBetween(1, 5).When(x => x.TeachingRating.HasValue)
            .WithMessage("Teaching rating must be between 1 and 5");

        RuleFor(x => x.TeachingComment)
            .MaximumLength(500).WithMessage("Teaching comment cannot exceed 500 characters");

        RuleFor(x => x.CommunicationRating)
            .InclusiveBetween(1, 5).When(x => x.CommunicationRating.HasValue)
            .WithMessage("Communication rating must be between 1 and 5");

        RuleFor(x => x.CommunicationComment)
            .MaximumLength(500).WithMessage("Communication comment cannot exceed 500 characters");

        RuleFor(x => x.ReliabilityRating)
            .InclusiveBetween(1, 5).When(x => x.ReliabilityRating.HasValue)
            .WithMessage("Reliability rating must be between 1 and 5");

        RuleFor(x => x.ReliabilityComment)
            .MaximumLength(500).WithMessage("Reliability comment cannot exceed 500 characters");
    }
}
