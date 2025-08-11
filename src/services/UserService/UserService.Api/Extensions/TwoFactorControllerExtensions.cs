using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class TwoFactorControllerExtensions
{
    public static RouteGroupBuilder MapTwoFactorController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder twoFactor = builder.MapGroup("/users/2fa")
            .RequireAuthorization()
            .WithTags("Two-Factor Authentication");

        twoFactor.MapPost("/generate", HandleGenerateTwoFactorSecret)
            .WithName("GenerateTwoFactorSecret")
            .WithSummary("Generate 2FA secret")
            .WithDescription("Generates a secret key for two-factor authentication")
            .Produces<ApiResponse<GenerateTwoFactorSecretResponse>>(200)
            .Produces(401);

        twoFactor.MapPost("/verify", HandleVerifyTwoFactorCode)
            .WithName("VerifyTwoFactorCode")
            .WithSummary("Verify 2FA code")
            .WithDescription("Verifies a TOTP code and enables two-factor authentication")
            .Produces<ApiResponse<VerifyTwoFactorCodeResponse>>(200)
            .Produces(400)
            .Produces(401);

        twoFactor.MapPost("/disable", HandleDisableTwoFactor)
            .WithName("DisableTwoFactor")
            .WithSummary("Disable 2FA")
            .WithDescription("Disables two-factor authentication for the user")
            .Produces<ApiResponse<DisableTwoFactorResponse>>(200)
            .Produces(400)
            .Produces(401);

        twoFactor.MapGet("/status", HandleGetTwoFactorStatus)
            .WithName("GetTwoFactorStatus")
            .WithSummary("Get 2FA status")
            .WithDescription("Gets the current two-factor authentication status")
            .Produces<ApiResponse<GetTwoFactorStatusResponse>>(200)
            .Produces(401);

        static async Task<IResult> HandleGenerateTwoFactorSecret(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new GenerateTwoFactorSecretCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleVerifyTwoFactorCode(IMediator mediator, ClaimsPrincipal user, [FromBody] VerifyTwoFactorCodeRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new VerifyTwoFactorCodeCommand(request.Code) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDisableTwoFactor(IMediator mediator, ClaimsPrincipal user, [FromBody] DisableTwoFactorRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DisableTwoFactorCommand(request.Password) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetTwoFactorStatus(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetTwoFactorStatusQuery(userId);
            return await mediator.SendQuery(query);
        }

        return twoFactor;
    }
}