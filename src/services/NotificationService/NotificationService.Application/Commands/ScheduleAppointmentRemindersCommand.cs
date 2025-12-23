using CQRS.Models;
using MediatR;

namespace NotificationService.Application.Commands;

public record ScheduleAppointmentRemindersCommand(
    string AppointmentId,
    string UserId,
    DateTime AppointmentTime,
    string? PartnerName,
    string? SkillName,
    string? MeetingLink
) : IRequest<ApiResponse<int>>; // Returns number of reminders scheduled
