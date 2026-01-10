using CQRS.Handlers;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Contracts.Matchmaking.Responses;
using CQRS.Models;
using Events.Integration.Matchmaking;
using MassTransit;
using Core.Common.Exceptions;
using Infrastructure.Caching;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateMatchRequestCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    IDistributedCacheService cacheService,
    ILogger<CreateMatchRequestCommandHandler> logger)
    : BaseCommandHandler<CreateMatchRequestCommand, CreateMatchRequestResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;
    private readonly IDistributedCacheService _cacheService = cacheService;

    public override async Task<ApiResponse<CreateMatchRequestResponse>> Handle(
        CreateMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.UserId) ||
            string.IsNullOrWhiteSpace(request.SkillId) ||
            string.IsNullOrWhiteSpace(request.TargetUserId) ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            throw new BusinessRuleViolationException(
                ErrorCodes.RequiredFieldMissing,
                "CreateMatchRequest",
                "Missing required fields for match request");
        }

        // Prevent users from requesting their own skills
        if (request.TargetUserId == request.UserId)
        {
            throw new BusinessRuleViolationException(
                ErrorCodes.BusinessRuleViolation,
                "CreateMatchRequest",
                "You cannot create a match request for your own skill");
        }

        // Validate that the requesting user has verified their email
        var isUserVerified = await _userServiceClient.ValidateUserForMatchRequestAsync(request.UserId ?? "", cancellationToken);
        if (!isUserVerified)
        {
            Logger.LogWarning("User {UserId} attempted to create match request without email verification", request.UserId);
            throw new BusinessRuleViolationException(
                ErrorCodes.AccountNotVerified,
                "CreateMatchRequest",
                "You must verify your email address before creating match requests");
        }

        // Check for existing pending request for the same skill using repository
        var hasPendingRequest = await _unitOfWork.MatchRequests.HasPendingRequestBetweenUsersAsync(
            request.UserId ?? "",
            request.TargetUserId,
            request.SkillId,
            cancellationToken);

        if (hasPendingRequest)
        {
            Logger.LogWarning("User {UserId} already has a pending request for skill {SkillId}",
                request.UserId, request.SkillId);
            throw new ResourceAlreadyExistsException(
                "MatchRequest",
                "SkillId",
                request.SkillId,
                "You already have a pending request for this skill");
        }

            // Generate ThreadId for grouping requests between users for this skill
            // Use sorted user IDs to ensure the same ThreadId regardless of who initiates the request
            // This allows counter-offers to be grouped in the same thread
            var sortedUserIds = new[] { request.UserId!, request.TargetUserId }.OrderBy(x => x).ToArray();
            var threadId = $"{sortedUserIds[0]}:{sortedUserIds[1]}:{request.SkillId}";
            var hashedThreadId = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(threadId));
            var threadIdGuid = new Guid(hashedThreadId.Take(16).ToArray()).ToString();

            var matchRequest = new MatchRequest
            {
                RequesterId = request.UserId ?? "",
                TargetUserId = request.TargetUserId,
                SkillId = request.SkillId,
                ThreadId = threadIdGuid,
                Description = request.Description ?? request.Message,
                Status = MatchRequestStatus.Pending,
                Message = request.Message,
                IsSkillExchange = request.IsSkillExchange,
                ExchangeSkillId = request.ExchangeSkillId,
                IsMonetaryOffer = request.IsMonetary,
                OfferedAmount = request.OfferedAmount,
                Currency = request.Currency ?? "EUR",
                SessionDurationMinutes = request.SessionDurationMinutes,
                TotalSessions = request.TotalSessions,
                PreferredDays = request.PreferredDays?.ToList() ?? new List<string>(),
                PreferredTimes = request.PreferredTimes?.ToList() ?? new List<string>(),
                AdditionalNotes = request.AdditionalNotes,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                ViewCount = 0,
                MatchAttempts = 0,
                ResponseMessage = null,
                RespondedAt = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.MatchRequests.CreateAsync(matchRequest, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event for event sourcing
            await _eventPublisher.Publish(
                new Events.Domain.Matchmaking.MatchRequestCreatedDomainEvent(
                    matchRequest.Id,
                    matchRequest.RequesterId,
                    matchRequest.TargetUserId,
                    matchRequest.SkillId,
                    matchRequest.Message,
                    matchRequest.IsSkillExchange,
                    matchRequest.ExchangeSkillId,
                    matchRequest.IsMonetaryOffer,
                    matchRequest.OfferedAmount,
                    matchRequest.Currency,
                    matchRequest.SessionDurationMinutes,
                    matchRequest.TotalSessions),
                cancellationToken);

            // INVALIDATE CACHE for both users - new match request created
            try
            {
                // Invalidate incoming match requests cache for TargetUser (receives the request)
                await _cacheService.RemoveByPatternAsync(
                    $"matchrequests:incoming:{request.TargetUserId}:*",
                    cancellationToken);

                // Invalidate outgoing match requests cache for Requester (sent the request)
                await _cacheService.RemoveByPatternAsync(
                    $"matchrequests:outgoing:{request.UserId}:*",
                    cancellationToken);

                Logger.LogInformation(
                    "Invalidated match request cache for users {RequesterId} and {TargetUserId}",
                    request.UserId, request.TargetUserId);
            }
            catch (Exception ex)
            {
                // Cache invalidation failure should not break the flow
                Logger.LogWarning(ex,
                    "Failed to invalidate match request cache for users {RequesterId} and {TargetUserId}. Cache will expire naturally.",
                    request.UserId, request.TargetUserId);
            }

            // Fetch names from services
            var requesterName = await _userServiceClient.GetUserNameAsync(request.UserId ?? "", cancellationToken);
            var targetUserName = await _userServiceClient.GetUserNameAsync(request.TargetUserId, cancellationToken);
            var skillName = await _skillServiceClient.GetSkillNameAsync(request.SkillId, cancellationToken);
            var exchangeSkillName = request.ExchangeSkillId != null
                ? await _skillServiceClient.GetSkillNameAsync(request.ExchangeSkillId, cancellationToken)
                : null;

            // Publish integration event for NotificationService
            var integrationEvent = new MatchRequestCreatedIntegrationEvent(
                requestId: matchRequest.Id,
                requesterId: matchRequest.RequesterId,
                requesterName: requesterName,
                targetUserId: matchRequest.TargetUserId,
                targetUserName: targetUserName,
                skillId: matchRequest.SkillId,
                skillName: skillName,
                message: matchRequest.Message,
                isSkillExchange: matchRequest.IsSkillExchange,
                exchangeSkillId: matchRequest.ExchangeSkillId,
                exchangeSkillName: exchangeSkillName,
                isMonetary: matchRequest.IsMonetaryOffer,
                offeredAmount: matchRequest.OfferedAmount,
                currency: matchRequest.Currency,
                sessionDurationMinutes: matchRequest.SessionDurationMinutes ?? 60,
                totalSessions: matchRequest.TotalSessions,
                preferredDays: matchRequest.PreferredDays?.ToArray() ?? Array.Empty<string>(),
                preferredTimes: matchRequest.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
                threadId: matchRequest.ThreadId ?? "",
                createdAt: matchRequest.CreatedAt
            );

            await _publishEndpoint.Publish(integrationEvent, cancellationToken);
            Logger.LogInformation("Published MatchRequestCreatedIntegrationEvent for RequestId: {RequestId}", matchRequest.Id);

            // Return simple response - frontend will refresh to get display data
            var response = new CreateMatchRequestResponse(
                RequestId: matchRequest.Id,
                Status: matchRequest.Status.ToString(),
                CreatedAt: matchRequest.CreatedAt,
                ThreadId: matchRequest.ThreadId ?? ""
            );

            return Success(response);
    }
}
