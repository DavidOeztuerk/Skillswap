using System.Security.Claims;
using Contracts.Matchmaking.Requests;
using Contracts.Matchmaking.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MatchmakingService.Extensions;

public static class Matchmaking
{
    public static RouteGroupBuilder MapMatchmakingController(this IEndpointRouteBuilder builder)
    {
        #region Match Requests Endpoints
        RouteGroupBuilder matchRequests = builder.MapGroup("/matches/requests").RequireAuthorization();

        matchRequests.MapPost("/", CreateMatchRequest)
            .WithName("CreateMatchRequest")
            .WithSummary("Create a direct match request to another user")
            .WithDescription("Send a match request to another user for a specific skill")
            .WithTags("Match Requests")
            .Produces<CreateMatchRequestResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        matchRequests.MapGet("/incoming", GetIncomingMatchRequests)
            .WithName("GetIncomingMatchRequests")
            .WithSummary("Get incoming match requests")
            .WithDescription("Retrieve all incoming match requests for the current user")
            .WithTags("Match Requests")
            .Produces<PagedResponse<MatchRequestDisplayResponse>>(StatusCodes.Status200OK);

        matchRequests.MapGet("/outgoing", GetOutgoingMatchRequests)
            .WithName("GetOutgoingMatchRequests")
            .WithSummary("Get outgoing match requests")
            .WithDescription("Retrieve all outgoing match requests from the current user")
            .WithTags("Match Requests")
            .Produces<PagedResponse<MatchRequestDisplayResponse>>(StatusCodes.Status200OK);

        matchRequests.MapPost("/{requestId}/accept", AcceptMatchRequest)
            .WithName("AcceptMatchRequest")
            .WithSummary("Accept a direct match request")
            .WithDescription("Accept an incoming match request and create a match")
            .WithTags("Match Requests")
            .Produces<ApiResponse<AcceptMatchRequestResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matchRequests.MapPost("/{requestId}/reject", RejectMatchRequest)
            .WithName("RejectMatchRequest")
            .WithSummary("Reject a direct match request")
            .WithDescription("Reject an incoming match request with optional reason")
            .WithTags("Match Requests")
            .Produces<ApiResponse<RejectMatchRequestResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matchRequests.MapGet("/thread/{threadId}", GetMatchRequestThread)
            .WithName("GetMatchRequestThread")
            .WithSummary("Get match request thread")
            .WithDescription("Get all requests in a thread between two users for a skill")
            .WithTags("Match Requests")
            .Produces<ApiResponse<MatchRequestThreadResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matchRequests.MapPost("/{requestId}/counter", CreateCounterOffer)
            .WithName("CreateCounterOffer")
            .WithSummary("Create a counter offer for a match request")
            .WithDescription("Respond to a match request with a counter offer")
            .WithTags("Match Requests")
            .Produces<ApiResponse<CreateMatchRequestResponse>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status404NotFound);


        // ============================================================================
        // HANDLER METHODS - MATCH REQUESTS
        // ============================================================================

        static async Task<IResult> CreateMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateMatchRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateMatchRequestCommand(
                request.SkillId,
                request.TargetUserId,
                request.Message,
                request.IsSkillExchange,
                request.ExchangeSkillId,
                request.IsMonetary,
                request.OfferedAmount,
                request.Currency,
                request.SessionDurationMinutes,
                request.TotalSessions,
                request.PreferredDays,
                request.PreferredTimes)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> GetIncomingMatchRequests(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetIncomingMatchRequestsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetIncomingMatchRequestsQuery(userId, request.PageNumber, request.PageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetOutgoingMatchRequests(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetOutgoingMatchRequestsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetOutgoingMatchRequestsQuery(userId, request.PageNumber, request.PageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> AcceptMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromRoute] string requestId, [FromBody] AcceptMatchProposalRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AcceptMatchRequestCommand(requestId, request?.ResponseMessage)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> RejectMatchRequest(IMediator mediator, ClaimsPrincipal user, [FromRoute] string requestId, [FromBody] RejectMatchRequestRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RejectMatchRequestCommand(requestId, request?.ResponseMessage)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> GetMatchRequestThread(IMediator mediator, ClaimsPrincipal user, [FromRoute] string threadId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetMatchRequestThreadQuery(threadId);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> CreateCounterOffer(
            IMediator mediator, 
            ClaimsPrincipal user, 
            [FromRoute] string requestId, 
            [FromBody] CreateCounterOfferRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateCounterOfferCommand(
                requestId,
                request.Message,
                request.IsSkillExchange,
                request.ExchangeSkillId,
                request.ExchangeSkillName,
                request.IsMonetaryOffer,
                request.OfferedAmount,
                "EUR",  // Default currency
                request.PreferredDays,
                request.PreferredTimes,
                request.SessionDurationMinutes ?? 60,
                request.TotalSessions ?? 1)
            {
                UserId = userId,
                OriginalRequestId = requestId
            };

            return await mediator.SendCommand(command);
        }

        #endregion

        #region Matching Endpoints
        RouteGroupBuilder matches = builder.MapGroup("/matches").RequireAuthorization();

        matches.MapPost("/find", FindMatch)
            .WithName("FindMatch")
            .WithSummary("Find skill matches")
            .WithDescription("Search for automated skill matches based on compatibility")
            .WithTags("Matching")
            .Produces<FindMatchResponse>(StatusCodes.Status200OK);

        matches.MapPost("/{matchId}/accept", AcceptMatch)
            .WithName("AcceptMatch")
            .WithSummary("Accept a match")
            .WithDescription("Accept an existing match proposal")
            .WithTags("Matching")
            .Produces<AcceptMatchResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matches.MapPost("/{matchId}/reject", RejectMatch)
            .WithName("RejectMatch")
            .WithSummary("Reject a match")
            .WithDescription("Reject an existing match proposal with optional reason")
            .WithTags("Matching")
            .Produces<RejectMatchResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matches.MapGet("/{matchId}", GetMatchDetails)
            .WithName("GetMatchDetails")
            .WithSummary("Get match details")
            .WithDescription("Retrieve detailed information about a specific match")
            .WithTags("Matching")
            .Produces<MatchDetailsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matches.MapGet("/my", GetUserMatches)
            .WithName("GetMyMatches")
            .WithSummary("Get my matches")
            .WithDescription("Retrieve all matches for the current user")
            .WithTags("Matching")
            .Produces<PagedResponse<UserMatchResponse>>(StatusCodes.Status200OK);

        matches.MapGet("/search", SearchMatches)
            .WithName("SearchMatches")
            .WithSummary("Search for matches")
            .WithDescription("Search for matches based on criteria")
            .WithTags("Matching")
            .Produces<PagedResponse<UserMatchResponse>>(StatusCodes.Status200OK);

        matches.MapPost("/{matchId}/complete", CompleteMatch)
            .WithName("CompleteMatch")
            .WithSummary("Complete a match")
            .WithDescription("Mark a match as completed with optional rating and feedback")
            .WithTags("Matching")
            .Produces<CompleteMatchResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        matches.MapPost("/{matchId}/dissolve", DissolveMatch)
            .WithName("DissolveMatch")
            .WithSummary("Dissolve a match")
            .WithDescription("Dissolve an active match with a reason")
            .WithTags("Matching")
            .Produces<DissolveMatchResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // ============================================================================
        // HANDLER METHODS - MATCHES
        // ============================================================================

        static async Task<IResult> FindMatch(IMediator mediator, ClaimsPrincipal user, [FromBody] FindMatchRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new FindMatchCommand(request.SkillId, request.SkillName, request.IsOffering, request.PreferredTags, request.RemoteOnly, request.MaxDistanceKm)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> AcceptMatch(IMediator mediator, ClaimsPrincipal user, string matchId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AcceptMatchCommand(matchId)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> RejectMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] RejectMatchRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RejectMatchCommand(matchId, request.Reason)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> GetMatchDetails(IMediator mediator, ClaimsPrincipal user, string matchId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetMatchDetailsQuery(matchId, userId);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetUserMatches(
            IMediator mediator,
            ClaimsPrincipal user,
            string? status = null,
            bool includeCompleted = true,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var userId = user.GetUserId();

            // DEBUG: Log all claims for debugging user ID issue
            var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("MatchmakingController");
            logger.LogWarning("DEBUG GetUserMatches: User claims: {Claims}",
                string.Join(", ", user.Claims.Select(c => $"{c.Type}={c.Value}")));
            logger.LogWarning("DEBUG GetUserMatches: Extracted UserId: {UserId}", userId ?? "NULL");

            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserMatchesQuery(userId, status, includeCompleted, pageNumber, pageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> SearchMatches(
            IMediator mediator,
            ClaimsPrincipal user,
            string? skillId = null,
            string? skillName = null,
            string? status = null,
            bool includeCompleted = false,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            // For now, just return user matches - this can be extended later with more search criteria
            var query = new GetUserMatchesQuery(userId, status, includeCompleted, pageNumber, pageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> CompleteMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] CompleteMatchRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CompleteMatchCommand(
                matchId,
                request?.SessionDurationMinutes,
                request?.Feedback,
                request?.Rating)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> DissolveMatch(IMediator mediator, ClaimsPrincipal user, string matchId, [FromBody] DissolveMatchRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request?.Reason))
            {
                return Results.BadRequest("Reason is required for dissolving a match");
            }

            var command = new DissolveMatchCommand(matchId, request.Reason)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }
        #endregion

        #region Analytics Endpoints
        RouteGroupBuilder analytics = builder.MapGroup("/analytics");

        analytics.MapGet("/statistics", GetMatchStatistics)
            .WithName("GetMatchStatistics")
            .WithSummary("Get matching statistics")
            .WithDescription("Retrieve overall matching statistics and insights")
            .WithTags("Analytics")
            .Produces<MatchStatisticsResponse>(StatusCodes.Status200OK);

        // ============================================================================
        // HANDLER METHODS - ANALYTICS
        // ============================================================================

        static async Task<IResult> GetMatchStatistics(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetMatchStatisticsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetMatchStatisticsQuery(request.FromDate, request.ToDate);

            return await mediator.SendQuery(query);
        }
        #endregion

        return matchRequests;
    }
}
