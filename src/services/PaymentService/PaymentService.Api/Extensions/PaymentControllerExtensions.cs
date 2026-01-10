using System.Security.Claims;
using Contracts.Payment.Requests;
using Contracts.Payment.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands;
using PaymentService.Application.Queries;
using PaymentService.Application.Services;

namespace PaymentService.Api.Extensions;

public static class PaymentControllerExtensions
{
    public static RouteGroupBuilder MapPaymentController(this IEndpointRouteBuilder builder)
    {
        var payments = builder.MapGroup("/payments");

        #region Products Endpoints

        payments.MapGet("/products", GetProducts)
            .WithName("GetPaymentProducts")
            .WithSummary("Get payment products")
            .WithDescription("Get available payment products (boost options)")
            .WithTags("PaymentProducts")
            .AllowAnonymous()
            .Produces<ApiResponse<List<PaymentProductResponse>>>(StatusCodes.Status200OK);

        #endregion

        #region Checkout Endpoints

        payments.MapPost("/checkout-session", CreateCheckoutSession)
            .WithName("CreateCheckoutSession")
            .WithSummary("Create Stripe checkout session")
            .WithDescription("Create a Stripe checkout session for payment")
            .WithTags("Checkout")
            .RequireAuthorization()
            .Produces<ApiResponse<CheckoutSessionResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        #endregion

        #region Payment Status Endpoints

        payments.MapGet("/{paymentId}/status", GetPaymentStatus)
            .WithName("GetPaymentStatus")
            .WithSummary("Get payment status")
            .WithDescription("Get the status of a payment")
            .WithTags("PaymentStatus")
            .RequireAuthorization()
            .Produces<ApiResponse<PaymentStatusResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        #endregion

        #region Webhook Endpoints

        payments.MapPost("/webhook", HandleWebhook)
            .WithName("HandleStripeWebhook")
            .WithSummary("Handle Stripe webhook")
            .WithDescription("Webhook endpoint for Stripe payment events")
            .WithTags("Webhook")
            .AllowAnonymous()
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        #endregion

        return payments;
    }

    #region Handler Methods

    private static async Task<IResult> GetProducts(
        IMediator mediator,
        [FromQuery] string? type)
    {
        var query = new GetPaymentProductsQuery(type);
        return await mediator.SendQuery(query);
    }

    private static async Task<IResult> CreateCheckoutSession(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromBody] CreateCheckoutSessionRequest request)
    {
        var userId = user.GetUserId();
        if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

        var command = new CreateCheckoutSessionCommand(
            request.ProductId,
            request.ReferenceId,
            request.ReferenceType,
            request.SuccessUrl,
            request.CancelUrl)
        {
            UserId = userId
        };

        return await mediator.SendCommand(command);
    }

    private static async Task<IResult> GetPaymentStatus(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromRoute] string paymentId)
    {
        var userId = user.GetUserId();
        if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

        var query = new GetPaymentStatusQuery(paymentId, userId);
        return await mediator.SendQuery(query);
    }

    private static async Task<IResult> HandleWebhook(
        IMediator mediator,
        HttpContext context,
        IStripeService stripeService,
        ILogger<Program> logger)
    {
        try
        {
            var json = await new StreamReader(context.Request.Body).ReadToEndAsync();
            var signature = context.Request.Headers["Stripe-Signature"].ToString();

            if (string.IsNullOrEmpty(signature))
            {
                logger.LogWarning("Stripe webhook received without signature");
                return Results.BadRequest("Missing Stripe-Signature header");
            }

            var command = new ProcessWebhookCommand(json, signature);
            var result = await mediator.Send(command);

            return result.Success
                ? Results.Ok()
                : Results.BadRequest(result.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Stripe webhook");
            return Results.BadRequest("Webhook processing failed");
        }
    }

    #endregion
}
