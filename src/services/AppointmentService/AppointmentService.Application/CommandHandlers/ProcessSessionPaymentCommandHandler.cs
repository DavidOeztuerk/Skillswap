using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
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

public class ProcessSessionPaymentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IStripePaymentService stripePaymentService,
    ILogger<ProcessSessionPaymentCommandHandler> logger)
    : BaseCommandHandler<ProcessSessionPaymentCommand, PaymentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IStripePaymentService _stripePaymentService = stripePaymentService;

    public override async Task<ApiResponse<PaymentResponse>> Handle(
        ProcessSessionPaymentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Processing payment for session: {SessionAppointmentId}", request.SessionAppointmentId);

            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify payer is the participant
            if (appointment.ParticipantUserId != request.PayerId)
                return Error("Only the participant can pay", ErrorCodes.Unauthorized);

            // Create payment record
            var payment = SessionPayment.Create(
                request.SessionAppointmentId,
                request.PayerId,
                request.PayeeId,
                request.Amount,
                request.Currency,
                request.PlatformFeePercent);

            payment.PaymentMethod = "card";
            payment.Provider = "Stripe"; // TODO: Make configurable

            await _unitOfWork.SessionPayments.CreateAsync(payment, cancellationToken);

            // Mark appointment as waiting for payment completion
            appointment.Status = SessionAppointmentStatus.WaitingForPayment;
            appointment.IsPaymentCompleted = false;
            appointment.PaymentAmount = request.Amount;
            appointment.Currency = request.Currency;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Process payment through Stripe
            payment.StartProcessing();
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            try
            {
                var paymentResult = await _stripePaymentService.ProcessSessionPaymentAsync(
                    payment.Id,
                    request.PayerId,
                    request.PayeeId,
                    request.Amount,
                    request.Currency,
                    request.PaymentMethodToken,
                    cancellationToken);

                if (paymentResult.Success)
                {
                    payment.Complete(paymentResult.TransactionId, "Stripe");
                    appointment.Status = SessionAppointmentStatus.PaymentCompleted;
                    appointment.IsPaymentCompleted = true;
                    appointment.PaymentCompletedAt = DateTime.UtcNow;

                    Logger.LogInformation(
                        "Payment completed successfully for session {SessionId}: TransactionId={TransactionId}",
                        request.SessionAppointmentId, paymentResult.TransactionId);
                }
                else
                {
                    payment.Fail(paymentResult.ErrorMessage ?? "Payment processing failed");
                    // Keep appointment status as WaitingForPayment - payment can be retried
                    Logger.LogWarning(
                        "Payment failed for session {SessionId}: {ErrorMessage}",
                        request.SessionAppointmentId, paymentResult.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex,
                    "Error calling Stripe payment service for session {SessionId}",
                    request.SessionAppointmentId);

                payment.Fail($"Payment processing error: {ex.Message}");
                // Keep appointment status as WaitingForPayment - payment can be retried
            }

            appointment.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionPaymentProcessedEvent(
                    appointment.Id,
                    request.PayerId,
                    request.PayeeId,
                    request.Amount,
                    request.Currency,
                    payment.Status,
                    payment.TransactionId),
                cancellationToken);

            // Publish integration event
            await _publishEndpoint.Publish(new SessionPaymentProcessedIntegrationEvent(
                appointment.Id,
                request.PayerId,
                request.PayeeId,
                "Organizer Name", // TODO: Fetch from UserService
                "Participant Name", // TODO: Fetch from UserService
                request.Amount,
                request.Currency,
                payment.Status,
                payment.TransactionId,
                null,
                payment.ProcessedAt ?? DateTime.UtcNow,
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("Payment processed successfully: {PaymentId}", payment.Id);

            return Success(new PaymentResponse(
                payment.Id,
                payment.Status,
                payment.Amount,
                payment.Currency,
                payment.TransactionId,
                payment.ProcessedAt),
                "Payment processed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error processing payment: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to process payment", ErrorCodes.InternalError);
        }
    }
}
