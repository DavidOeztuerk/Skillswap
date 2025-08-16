using Contracts.User.Responses;
using CQRS.Extensions;
using CQRS.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;
using System.Security.Claims;
using Infrastructure.Extensions;
using UserService.Api.Models;

namespace UserService.Api.Extensions;

public static class UserVerificationControllerExensions
{
    public static RouteGroupBuilder MapUserVerificationController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder users = builder.MapGroup("/users")
            .WithTags("Users");

        users.MapGet("/email-availability", HandleCheckEmailAvailability)
            .WithName("CheckEmailAvailability")
            .WithSummary("Check email availability")
            .WithDescription("Checks if an email address is available for registration")
            .Produces<ApiResponse<EmailAvailabilityResponse>>(200)
            .Produces(400);

        users.MapPost("/phone/send-verification", HandleSendPhoneVerification)
            .WithName("SendPhoneVerification")
            .WithSummary("Send phone verification code")
            .WithDescription("Sends SMS verification code to user's phone")
            .RequireAuthorization()
            .Produces(204)
            .Produces(400)
            .Produces(429);

        users.MapPost("/phone/verify", HandleVerifyPhone)
            .WithName("VerifyPhone")
            .WithSummary("Verify phone number")
            .WithDescription("Verifies phone number with the code sent via SMS")
            .RequireAuthorization()
            .Produces(204)
            .Produces(400)
            .Produces(401);

        static async Task<IResult> HandleCheckEmailAvailability(IMediator mediator, [FromQuery] string email)
        {
            var query = new CheckEmailAvailabilityQuery(email);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleSendPhoneVerification(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] SendPhoneVerificationRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendPhoneVerificationCommand(request.PhoneNumber)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleVerifyPhone(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] VerifyPhoneRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new VerifyPhoneCommand(request.Code ?? string.Empty)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        return users;
    }
}
