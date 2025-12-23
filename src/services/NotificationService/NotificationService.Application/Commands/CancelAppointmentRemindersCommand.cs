using CQRS.Models;
using MediatR;

namespace NotificationService.Application.Commands;

public record CancelAppointmentRemindersCommand(string AppointmentId) : IRequest<ApiResponse<int>>; // Returns number of reminders cancelled
