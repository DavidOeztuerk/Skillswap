// using CQRS.Interfaces;
// using Contracts.Appointment.Responses;
// using AppointmentService.Application.Commands;
// using AppointmentService.Domain;
// using AppointmentService.Infrastructure.Data;
// using Microsoft.EntityFrameworkCore;
// using MassTransit;
// using Events.Appointment;
// using Infrastructure.Logging;

// namespace AppointmentService.Application.CommandHandlers;

// public class CancelAppointmentCommandHandler : ICommandHandler<CancelAppointmentCommand, CancelAppointmentResponse>
// {
//     private readonly ApplicationDbContext _dbContext;
//     private readonly IPublishEndpoint _eventPublisher;
//     private readonly ILogger<CancelAppointmentCommandHandler> _logger;

//     public CancelAppointmentCommandHandler(
//         ApplicationDbContext dbContext,
//         IPublishEndpoint eventPublisher,
//         ILogger<CancelAppointmentCommandHandler> logger)
//     {
//         _dbContext = dbContext;
//         _eventPublisher = eventPublisher;
//         _logger = logger;
//     }

//     public async Task<Result<CancelAppointmentResponse>> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
//     {
//         _logger.LogInformation("Cancelling appointment {AppointmentId} by user {UserId}", request.AppointmentId, request.UserId);

//         var appointment = await _dbContext.Appointments
//             .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);

//         if (appointment == null)
//         {
//             return Result<CancelAppointmentResponse>.Error("Appointment not found");
//         }

//         // Verify user can cancel this appointment
//         if (appointment.RequesterId != request.UserId && appointment.ProviderId != request.UserId)
//         {
//             return Result<CancelAppointmentResponse>.Error("You are not authorized to cancel this appointment");
//         }

//         // Check if appointment can be cancelled
//         if (appointment.Status == AppointmentStatus.Cancelled)
//         {
//             return Result<CancelAppointmentResponse>.Error("Appointment is already cancelled");
//         }

//         if (appointment.Status == AppointmentStatus.Completed)
//         {
//             return Result<CancelAppointmentResponse>.Error("Cannot cancel a completed appointment");
//         }

//         // Check cancellation policy (e.g., 24 hours notice)
//         var hoursUntilAppointment = (appointment.ScheduledDateTime - DateTime.UtcNow).TotalHours;
//         if (hoursUntilAppointment < 24 && appointment.Status == AppointmentStatus.Confirmed)
//         {
//             _logger.LogWarning("Late cancellation for appointment {AppointmentId} - only {Hours} hours notice", 
//                 request.AppointmentId, hoursUntilAppointment);
//         }

//         var previousStatus = appointment.Status;
//         appointment.Status = AppointmentStatus.Cancelled;
//         appointment.CancellationReason = request.CancellationReason;
//         appointment.CancelledBy = request.UserId;
//         appointment.CancelledAt = DateTime.UtcNow;
//         appointment.UpdatedAt = DateTime.UtcNow;

//         await _dbContext.SaveChangesAsync(cancellationToken);

//         // Publish domain event
//         await _eventPublisher.Publish(new AppointmentCancelledEvent
//         {
//             AppointmentId = appointment.Id,
//             RequesterId = appointment.RequesterId,
//             ProviderId = appointment.ProviderId,
//             CancelledBy = request.UserId,
//             CancellationReason = request.CancellationReason,
//             PreviousStatus = previousStatus.ToString(),
//             ScheduledDateTime = appointment.ScheduledDateTime,
//             IsLateCancellation = hoursUntilAppointment < 24,
//             Timestamp = DateTime.UtcNow
//         }, cancellationToken);

//         _logger.LogInformation("Successfully cancelled appointment {AppointmentId}", appointment.Id);

//         return Result<CancelAppointmentResponse>.Success(new CancelAppointmentResponse(
//             appointment.Id,
//             appointment.Status.ToString(),
//             appointment.CancellationReason,
//             appointment.CancelledBy,
//             appointment.CancelledAt.Value
//         ));
//     }
// }