using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Contracts.Appointment.Responses;
using Events.Domain.Appointment;
using EventSourcing;
using Core.Common.Exceptions;
using MassTransit;
using Events.Integration.Appointment;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class RateSessionCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    ILogger<RateSessionCommandHandler> logger)
    : BaseCommandHandler<RateSessionCommand, RatingResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<RatingResponse>> Handle(
        RateSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Rating session: {SessionAppointmentId} by {RaterId}",
                request.SessionAppointmentId, request.RaterId);

            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify rater is one of the participants
            if (appointment.OrganizerUserId != request.RaterId && appointment.ParticipantUserId != request.RaterId)
                return Error("User is not part of this session", ErrorCodes.Unauthorized);

            // Check if session is completed
            if (appointment.Status != SessionAppointmentStatus.Completed)
                return Error("Can only rate completed sessions", ErrorCodes.InvalidOperation);

            // Check if already rated by this user
            var existingRating = await _unitOfWork.SessionRatings.GetBySessionAndRaterAsync(
                request.SessionAppointmentId,
                request.RaterId,
                cancellationToken);

            if (existingRating != null)
                return Error("User has already rated this session", ErrorCodes.InvalidOperation);

            // Determine who is being rated
            var rateeId = appointment.OrganizerUserId == request.RaterId
                ? appointment.ParticipantUserId
                : appointment.OrganizerUserId;

            // Create rating with section data
            // Note: SkillId is in SessionSeries, so we pass null for now (can be enhanced later)
            var rating = SessionRating.Create(
                request.SessionAppointmentId,
                request.RaterId,
                rateeId,
                request.Rating,
                request.Feedback,
                request.IsPublic,
                request.WouldRecommend,
                request.Tags,
                request.KnowledgeRating,
                request.KnowledgeComment,
                request.TeachingRating,
                request.TeachingComment,
                request.CommunicationRating,
                request.CommunicationComment,
                request.ReliabilityRating,
                request.ReliabilityComment,
                appointment.SessionSeries?.SkillId,
                null);

            await _unitOfWork.SessionRatings.CreateAsync(rating, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionRatedEvent(
                    appointment.Id,
                    request.RaterId,
                    rateeId,
                    request.Rating,
                    request.Feedback,
                    request.IsPublic),
                cancellationToken);

            // Publish integration event
            await _publishEndpoint.Publish(new SessionRatedIntegrationEvent(
                appointment.Id,
                request.RaterId,
                rateeId,
                request.Rating,
                request.Feedback,
                request.IsPublic,
                request.WouldRecommend,
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("Session rated successfully: {RatingId}", rating.Id);

            return Success(new RatingResponse(
                rating.Id,
                request.Rating,
                request.Feedback,
                rating.CreatedAt),
                "Session rated successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error rating session: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to rate session", ErrorCodes.InternalError);
        }
    }
}
