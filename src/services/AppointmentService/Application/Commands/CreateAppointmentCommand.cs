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
            .GreaterThan(DateTime.UtcNow).WithMessage("Scheduled date must be in the future");

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours");

        RuleFor(x => x.ParticipantUserId)
            .NotEmpty().WithMessage("Participant user ID is required");

        RuleFor(x => x.MeetingType)
            .Must(BeValidMeetingType).WithMessage("Invalid meeting type");
    }

    private static bool BeValidMeetingType(string? meetingType)
    {
        var validTypes = new[] { "VideoCall", "InPerson", "Phone", "Online" };
        return string.IsNullOrEmpty(meetingType) || validTypes.Contains(meetingType);
    }
}