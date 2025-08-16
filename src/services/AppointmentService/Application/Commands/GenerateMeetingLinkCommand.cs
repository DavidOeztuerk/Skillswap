using CQRS.Interfaces;
using CQRS.Models;

namespace AppointmentService.Application.Commands;

public record GenerateMeetingLinkCommand(string AppointmentId) : ICommand<string>;