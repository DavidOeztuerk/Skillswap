using CQRS.Handlers;
using CQRS.Models;
using Contracts.Payment.Responses;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Commands;
using PaymentService.Application.Services;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.CommandHandlers;

public class CreateCheckoutSessionCommandHandler(
    IPaymentUnitOfWork unitOfWork,
    IStripeService stripeService,
    ILogger<CreateCheckoutSessionCommandHandler> logger)
    : BaseCommandHandler<CreateCheckoutSessionCommand, CheckoutSessionResponse>(logger)
{
    private readonly IPaymentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IStripeService _stripeService = stripeService;

    public override async Task<ApiResponse<CheckoutSessionResponse>> Handle(
        CreateCheckoutSessionCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("User ID is required");
        }

        Logger.LogInformation(
            "Creating checkout session for user {UserId}, product {ProductId}",
            request.UserId, request.ProductId);

        // Business Logic: Check if product exists and is active
        var product = await _unitOfWork.PaymentProducts.GetByIdAsync(
            request.ProductId, cancellationToken);

        if (product == null || !product.IsActive)
        {
            return Error("Product not found or inactive", "PRODUCT_NOT_FOUND");
        }

        // Create Stripe Checkout Session
        var metadata = new Dictionary<string, string>
        {
            ["userId"] = request.UserId,
            ["productId"] = request.ProductId,
            ["referenceId"] = request.ReferenceId ?? "",
            ["referenceType"] = request.ReferenceType ?? ""
        };

        var sessionResult = await _stripeService.CreateCheckoutSessionAsync(
            product.Name,
            product.Price,
            product.Currency,
            request.SuccessUrl,
            request.CancelUrl,
            metadata,
            cancellationToken);

        // Create Payment entity
        var payment = Payment.Create(
            request.UserId,
            request.ProductId,
            sessionResult.SessionId,
            product.Price,
            product.Currency,
            request.ReferenceId,
            request.ReferenceType);

        await _unitOfWork.Payments.CreateAsync(payment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Checkout session {SessionId} created for payment {PaymentId}",
            sessionResult.SessionId, payment.Id);

        var response = new CheckoutSessionResponse(payment.Id, sessionResult.Url);
        return Success(response, "Checkout session created successfully");
    }
}
