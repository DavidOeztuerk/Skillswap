using Contracts.VideoCall.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace VideocallService.Application.Commands;

public record CreateCallSessionCommand(
    string ParticipantUserId,
    string? AppointmentId = null,
    string? MatchId = null,
    bool IsRecorded = false,
    int MaxParticipants = 2) : ICommand<CreateCallSessionResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "call-history:*",
        "call-statistics"
    };
}

public class CreateCallSessionCommandValidator : AbstractValidator<CreateCallSessionCommand>
{
    public CreateCallSessionCommandValidator()
    {
        RuleFor(x => x.ParticipantUserId)
            .NotEmpty().WithMessage("Participant user ID is required");

        RuleFor(x => x.MaxParticipants)
            .GreaterThan(1).WithMessage("Max participants must be greater than 1")
            .LessThanOrEqualTo(10).WithMessage("Max participants cannot exceed 10");
    }
}
