using Contracts.Chat.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Queries.Chat;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.QueryHandlers.Chat;

/// <summary>
/// Handler for getting unread message counts
/// </summary>
public class GetChatUnreadCountQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetChatUnreadCountQueryHandler> logger)
    : BaseQueryHandler<GetChatUnreadCountQuery, ChatUnreadCountResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<ChatUnreadCountResponse>> Handle(
        GetChatUnreadCountQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var totalUnread = await _unitOfWork.ChatThreads
                .GetTotalUnreadCountAsync(request.UserId, cancellationToken);

            var threadsWithUnread = await _unitOfWork.ChatThreads
                .GetWithUnreadMessagesAsync(request.UserId, cancellationToken);

            var threadCounts = threadsWithUnread.Select(t => new ThreadUnreadCount
            {
                ThreadId = t.ThreadId,
                UnreadCount = t.GetUnreadCount(request.UserId),
                OtherParticipantName = t.GetOtherParticipantName(request.UserId)
            }).ToList();

            var response = new ChatUnreadCountResponse
            {
                TotalUnreadCount = totalUnread,
                ThreadUnreadCounts = threadCounts
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving unread counts for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving unread counts", ErrorCodes.InternalError);
        }
    }
}
