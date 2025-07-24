// using CQRS.Interfaces;
// using Contracts.Appointment.Responses;
// using AppointmentService.Application.Commands;
// using AppointmentService.Domain;
// using Microsoft.EntityFrameworkCore;
// using MassTransit;

// namespace AppointmentService.Application.CommandHandlers;

// public class RescheduleAppointmentCommandHandler : ICommandHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>
// {
//     private readonly ApplicationDbContext _dbContext;
//     private readonly IPublishEndpoint _eventPublisher;
//     private readonly ILogger<RescheduleAppointmentCommandHandler> _logger;

//     public RescheduleAppointmentCommandHandler(
//         ApplicationDbContext dbContext,
//         IPublishEndpoint eventPublisher,
//         ILogger<RescheduleAppointmentCommandHandler> logger)
//     {
//         _dbContext = dbContext;
//         _eventPublisher = eventPublisher;
//         _logger = logger;
//     }

//     public async Task<Result<RescheduleAppointmentResponse>> Handle(RescheduleAppointmentCommand request, CancellationToken cancellationToken)
//     {
//         _logger.LogInformation("Rescheduling appointment {AppointmentId} to {NewDateTime}", 
//             request.AppointmentId, request.NewDateTime);

//         var appointment = await _dbContext.Appointments
//             .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);

//         if (appointment == null)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("Appointment not found");
//         }

//         // Verify user can reschedule this appointment
//         if (appointment.RequesterId != request.UserId && appointment.ProviderId != request.UserId)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("You are not authorized to reschedule this appointment");
//         }

//         // Check if appointment can be rescheduled
//         if (appointment.Status == AppointmentStatus.Cancelled)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("Cannot reschedule a cancelled appointment");
//         }

//         if (appointment.Status == AppointmentStatus.Completed)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("Cannot reschedule a completed appointment");
//         }

//         // Validate new datetime
//         if (request.NewDateTime <= DateTime.UtcNow)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("New appointment time must be in the future");
//         }

//         // Check for conflicts with other appointments
//         var hasConflict = await _dbContext.Appointments
//             .AnyAsync(a => 
//                 a.Id != request.AppointmentId &&
//                 (a.RequesterId == appointment.RequesterId || a.ProviderId == appointment.ProviderId) &&
//                 a.Status != AppointmentStatus.Cancelled &&
//                 a.ScheduledDateTime.Date == request.NewDateTime.Date &&
//                 Math.Abs((a.ScheduledDateTime - request.NewDateTime).TotalMinutes) < appointment.DurationMinutes,
//                 cancellationToken);

//         if (hasConflict)
//         {
//             return Result<RescheduleAppointmentResponse>.Error("The new time conflicts with another appointment");
//         }

//         var oldDateTime = appointment.ScheduledDateTime;
//         var oldStatus = appointment.Status;

//         appointment.ScheduledDateTime = request.NewDateTime;
//         appointment.RescheduleReason = request.Reason;
//         appointment.RescheduledBy = request.UserId;
//         appointment.RescheduledAt = DateTime.UtcNow;
//         appointment.UpdatedAt = DateTime.UtcNow;

//         // If rescheduled by one party, it needs confirmation from the other
//         if (appointment.Status == AppointmentStatus.Confirmed)
//         {
//             appointment.Status = AppointmentStatus.Pending;
//         }

//         await _dbContext.SaveChangesAsync(cancellationToken);

//         // Publish domain event
//         await _eventPublisher.Publish(new AppointmentRescheduledEvent
//         {
//             AppointmentId = appointment.Id,
//             RequesterId = appointment.RequesterId,
//             ProviderId = appointment.ProviderId,
//             RescheduledBy = request.UserId,
//             OldDateTime = oldDateTime,
//             NewDateTime = request.NewDateTime,
//             Reason = request.Reason,
//             PreviousStatus = oldStatus.ToString(),
//             NewStatus = appointment.Status.ToString(),
//             RequiresReconfirmation = appointment.Status == AppointmentStatus.Pending,
//             Timestamp = DateTime.UtcNow
//         }, cancellationToken);

//         _logger.LogInformation("Successfully rescheduled appointment {AppointmentId} from {OldDateTime} to {NewDateTime}", 
//             appointment.Id, oldDateTime, request.NewDateTime);

//         return Result<RescheduleAppointmentResponse>.Success(new RescheduleAppointmentResponse(
//             appointment.Id,
//             appointment.ScheduledDateTime,
//             appointment.Status.ToString(),
//             appointment.RescheduleReason,
//             appointment.RescheduledBy,
//             appointment.RescheduledAt.Value,
//             appointment.Status == AppointmentStatus.Pending
//         ));
//     }
// }