using CQRS.Interfaces;
using FluentValidation;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Commands;

public record CreateAppointmentCommand(
    string Title,
    string? Description,
    DateTime ScheduledDate,
    int DurationMinutes,
    string ParticipantUserId,
    string? SkillId = null,
    string? MatchId = null,
    string? MeetingType = "VideoCall")
    : ICommand<CreateAppointmentResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-appointments:*"
    };
}


public class CreateAppointmentCommandValidator : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .Length(3, 200).WithMessage("Title must be between 3 and 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.ScheduledDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Scheduled date must be in the future")
            .Must(date => date < DateTime.UtcNow.AddYears(1)).WithMessage("Cannot schedule more than 1 year in advance");

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(15).WithMessage("Duration must be at least 15 minutes")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours");

        RuleFor(x => x.ParticipantUserId)
            .NotEmpty().WithMessage("Participant user ID is required")
            .Must((command, participantId) => participantId != command.UserId)
            .WithMessage("Cannot create appointment with yourself");

        RuleFor(x => x.MeetingType)
            .Must(BeValidMeetingType).WithMessage("Invalid meeting type. Allowed: VideoCall, InPerson, Phone, Online");
    }

    private static bool BeValidMeetingType(string? meetingType)
    {
        var validTypes = new[] { "VideoCall", "InPerson", "Phone", "Online" };
        return string.IsNullOrEmpty(meetingType) || validTypes.Contains(meetingType);
    }
}