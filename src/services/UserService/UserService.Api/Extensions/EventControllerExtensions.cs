using EventSourcing;
using Microsoft.AspNetCore.Mvc;

namespace UserService.Api.Extensions;

public static class EventControllerExtensions
{
    public static RouteGroupBuilder MapEventController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder events = builder.MapGroup("/users/events");

        events.MapPost("/replay", ([FromBody] EventReplayService request) =>
            Results.Ok(new { Message = "Event replay initiated" }))
            .WithName("ReplayEvents")
            .WithSummary("Replay domain events")
            .WithTags("Events");

        return events;
    }
}
