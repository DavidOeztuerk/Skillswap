using Contracts.User.Responses;
using CQRS.Extensions;
using CQRS.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserControllerExtensions
{
    public static RouteGroupBuilder MapUserController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder users = builder.MapGroup("/users")
            .WithTags("Users");

        users.MapGet("/email-availability", HandleCheckEmailAvailability)
            .WithName("CheckEmailAvailability")
            .WithSummary("Check email availability")
            .WithDescription("Checks if an email address is available for registration")
            .Produces<ApiResponse<EmailAvailabilityResponse>>(200)
            .Produces(400);

        static async Task<IResult> HandleCheckEmailAvailability(IMediator mediator, [FromQuery] string email)
        {
            var query = new CheckEmailAvailabilityQuery(email);
            return await mediator.SendQuery(query);
        }

        return users;
    }
}
