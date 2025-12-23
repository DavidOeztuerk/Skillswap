using System.Security.Claims;
using Contracts.Chat.Requests;
using Contracts.Chat.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Commands.Chat;
using NotificationService.Application.Queries.Chat;

namespace NotificationService.Api.Extensions;

/// <summary>
/// API endpoints for chat functionality
/// </summary>
public static class ChatControllerExtensions
{
    public static RouteGroupBuilder MapChatController(this IEndpointRouteBuilder builder)
    {
        var chat = builder.MapGroup("/chat").WithTags("Chat");

        #region Thread Endpoints

        chat.MapGet("/threads", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            [AsParameters] GetChatThreadsRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetChatThreadsQuery(
                userId,
                request.SearchTerm,
                request.UnreadOnly ?? false,
                request.PageNumber ?? 1,
                request.PageSize ?? 20);

            return await mediator.SendQuery(query);
        })
        .WithName("GetChatThreads")
        .WithSummary("Get user's chat threads")
        .WithDescription("Retrieves all chat threads for the authenticated user, ordered by last message date")
        .RequireAuthorization()
        .Produces<PagedResponse<ChatThreadResponse>>(200);

        chat.MapGet("/threads/{threadId}", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string threadId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetChatThreadQuery(userId, threadId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetChatThread")
        .WithSummary("Get a specific chat thread")
        .WithDescription("Retrieves details of a specific chat thread")
        .RequireAuthorization()
        .Produces<ApiResponse<ChatThreadResponse>>(200)
        .Produces(404);

        chat.MapPost("/threads", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            [FromBody] CreateChatThreadRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateChatThreadCommand(
                request.ThreadId,
                request.Participant1Id,
                request.Participant2Id,
                request.Participant1Name,
                request.Participant2Name,
                request.Participant1AvatarUrl,
                request.Participant2AvatarUrl,
                request.SkillId,
                request.SkillName,
                request.MatchId);

            return await mediator.SendCommand(command);
        })
        .WithName("CreateChatThread")
        .WithSummary("Create a chat thread")
        .WithDescription("Creates a new chat thread (typically triggered by match acceptance)")
        .RequireAuthorization()
        .Produces<ApiResponse<ChatThreadResponse>>(201)
        .Produces(400);

        #endregion

        #region Message Endpoints

        chat.MapGet("/threads/{threadId}/messages", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string threadId,
            [AsParameters] GetChatMessagesRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetChatMessagesQuery(
                userId,
                threadId,
                request.AfterMessageId,
                request.AfterTimestamp,
                request.SearchTerm,
                request.MessageType,
                request.Context,
                request.ContextReferenceId,
                request.PageNumber ?? 1,
                request.PageSize ?? 50);

            return await mediator.SendQuery(query);
        })
        .WithName("GetChatMessages")
        .WithSummary("Get messages for a thread")
        .WithDescription("Retrieves messages for a specific chat thread with pagination")
        .RequireAuthorization()
        .Produces<PagedResponse<ChatMessageResponse>>(200)
        .Produces(404);

        chat.MapPost("/threads/{threadId}/messages", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string threadId,
            [FromBody] SendChatMessageRequest request) =>
        {
            var userId = claims.GetUserId();
            var userName = claims.GetUserName() ?? "User";
            var avatarUrl = claims.FindFirst("avatar_url")?.Value ?? claims.FindFirst("picture")?.Value;

            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendChatMessageCommand(
                userId, userName, avatarUrl,
                threadId,
                request.Content,
                request.MessageType,
                request.Context,
                request.ContextReferenceId,
                request.ReplyToMessageId,
                request.CodeLanguage,
                request.GiphyId,
                request.GifUrl,
                request.IsEncrypted,
                request.EncryptedContent,
                request.EncryptionKeyId,
                request.EncryptionIV);

            return await mediator.SendCommand(command);
        })
        .WithName("SendChatMessage")
        .WithSummary("Send a message")
        .WithDescription("Sends a new message to a chat thread (prefer SignalR for real-time)")
        .RequireAuthorization()
        .Produces<ApiResponse<ChatMessageResponse>>(201)
        .Produces(400);

        #endregion

        #region Read Receipts

        chat.MapPost("/threads/{threadId}/read", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string threadId,
            [FromBody] MarkMessagesAsReadRequest? request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new MarkMessagesAsReadCommand(
                userId,
                threadId,
                request?.BeforeTimestamp,
                request?.MessageId);

            return await mediator.SendCommand(command);
        })
        .WithName("MarkMessagesAsRead")
        .WithSummary("Mark messages as read")
        .WithDescription("Marks all or specific messages as read in a thread")
        .RequireAuthorization()
        .Produces<ApiResponse<bool>>(200);

        #endregion

        #region Reactions

        chat.MapPost("/messages/{messageId}/reactions", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string messageId,
            [FromBody] AddReactionRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddReactionCommand(userId, messageId, request.Emoji, request.Remove);
            return await mediator.SendCommand(command);
        })
        .WithName("ToggleReaction")
        .WithSummary("Add or remove a reaction")
        .WithDescription("Adds or removes a reaction emoji from a message")
        .RequireAuthorization()
        .Produces<ApiResponse<bool>>(200);

        #endregion

        #region Delete Message

        chat.MapDelete("/messages/{messageId}", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string messageId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteChatMessageCommand(messageId, userId);
            return await mediator.SendCommand(command);
        })
        .WithName("DeleteChatMessage")
        .WithSummary("Delete a message")
        .WithDescription("Soft-deletes a chat message (only the sender can delete)")
        .RequireAuthorization()
        .Produces<ApiResponse<bool>>(200)
        .Produces(403)
        .Produces(404);

        #endregion

        #region Unread Count

        chat.MapGet("/unread", async (
            IMediator mediator,
            ClaimsPrincipal claims) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetChatUnreadCountQuery(userId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetChatUnreadCount")
        .WithSummary("Get unread message count")
        .WithDescription("Retrieves the total unread message count and per-thread breakdown")
        .RequireAuthorization()
        .Produces<ApiResponse<ChatUnreadCountResponse>>(200);

        #endregion

        #region Typing Indicator

        chat.MapPost("/threads/{threadId}/typing", async (
            IMediator mediator,
            ClaimsPrincipal claims,
            string threadId,
            [FromQuery] bool isTyping = true) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateTypingIndicatorCommand(userId, threadId, isTyping);
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateTypingIndicator")
        .WithSummary("Update typing indicator")
        .WithDescription("Updates the typing indicator for a user in a thread (prefer SignalR)")
        .RequireAuthorization()
        .Produces<ApiResponse<bool>>(200);

        #endregion

        return chat;
    }

    /// <summary>
    /// Helper to get user name from claims
    /// </summary>
    private static string? GetUserName(this ClaimsPrincipal claims)
    {
        return claims.FindFirst(ClaimTypes.Name)?.Value ??
               claims.FindFirst("name")?.Value ??
               claims.FindFirst("preferred_username")?.Value;
    }
}
