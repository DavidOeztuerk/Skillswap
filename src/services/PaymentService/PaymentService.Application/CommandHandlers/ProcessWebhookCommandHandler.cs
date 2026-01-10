using CQRS.Handlers;
using CQRS.Models;
using Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Commands;
using PaymentService.Application.Services;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.CommandHandlers;

public class ProcessWebhookCommandHandler(
    IPaymentUnitOfWork unitOfWork,
    IStripeService stripeService,
    IPublishEndpoint publishEndpoint,
    ILogger<ProcessWebhookCommandHandler> logger)
    : BaseCommandHandler<ProcessWebhookCommand, bool>(logger)
{
    private readonly IPaymentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IStripeService _stripeService = stripeService;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<bool>> Handle(
        ProcessWebhookCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing Stripe webhook");

        StripeWebhookResult webhookResult;
        try
        {
            webhookResult = _stripeService.ConstructWebhookEvent(request.Json, request.Signature);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Stripe webhook validation failed");
            return Error("Invalid webhook signature");
        }

        Logger.LogInformation("Received Stripe event: {EventType}", webhookResult.EventType);

        if (webhookResult.EventType == "checkout.session.completed")
        {
            await HandleCheckoutSessionCompleted(webhookResult, cancellationToken);
        }
        else if (webhookResult.EventType == "checkout.session.expired")
        {
            await HandleCheckoutSessionExpired(webhookResult, cancellationToken);
        }

        return Success(true);
    }

    private async Task HandleCheckoutSessionCompleted(
        StripeWebhookResult webhookResult,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(webhookResult.SessionId))
        {
            Logger.LogWarning("Checkout session completed but no session ID found");
            return;
        }

        var payment = await _unitOfWork.Payments.GetByStripeSessionIdAsync(
            webhookResult.SessionId, cancellationToken);

        if (payment == null)
        {
            Logger.LogWarning("Payment not found for session {SessionId}", webhookResult.SessionId);
            return;
        }

        payment.MarkAsSucceeded(webhookResult.PaymentIntentId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var product = await _unitOfWork.PaymentProducts.GetByIdAsync(
            payment.ProductId, cancellationToken);

        if (product == null)
        {
            Logger.LogWarning("Product {ProductId} not found for payment {PaymentId}",
                payment.ProductId, payment.Id);
            return;
        }

        // Publish Integration Event via MassTransit
        var integrationEvent = new PaymentSucceededIntegrationEvent(
            payment.Id,
            payment.UserId,
            payment.ProductId,
            product.ProductType,
            payment.ReferenceId,
            payment.ReferenceType,
            product.BoostType,
            product.DurationDays,
            payment.Amount,
            payment.Currency,
            payment.CompletedAt!.Value);

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);

        Logger.LogInformation(
            "Payment {PaymentId} succeeded, PaymentSucceededIntegrationEvent published",
            payment.Id);
    }

    private async Task HandleCheckoutSessionExpired(
        StripeWebhookResult webhookResult,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(webhookResult.SessionId))
        {
            return;
        }

        var payment = await _unitOfWork.Payments.GetByStripeSessionIdAsync(
            webhookResult.SessionId, cancellationToken);

        if (payment == null)
        {
            return;
        }

        payment.MarkAsCancelled();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Payment {PaymentId} cancelled (session expired)", payment.Id);
    }
}
