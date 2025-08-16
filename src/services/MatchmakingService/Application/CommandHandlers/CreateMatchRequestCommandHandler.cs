using CQRS.Handlers;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Infrastructure.HttpClients;
using Contracts.Matchmaking.Responses;
using CQRS.Models;
using Events.Integration.Matchmaking;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<CreateMatchRequestCommandHandler> logger)
    : BaseCommandHandler<CreateMatchRequestCommand, CreateMatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<CreateMatchRequestResponse>> Handle(
        CreateMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.UserId) ||
                string.IsNullOrWhiteSpace(request.SkillId) ||
                string.IsNullOrWhiteSpace(request.TargetUserId) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Error("Missing required fields");
            }

            // Prevent users from requesting their own skills
            if (request.TargetUserId == request.UserId)
            {
                return Error("You cannot create a match request for your own skill");
            }

            // Check for existing pending request for the same skill
            var existingRequest = await _dbContext.MatchRequests
                .FirstOrDefaultAsync(mr => 
                    mr.RequesterId == request.UserId &&
                    mr.SkillId == request.SkillId &&
                    mr.TargetUserId == request.TargetUserId &&
                    (mr.Status == "pending" || mr.Status == "accepted"),
                    cancellationToken);

            if (existingRequest != null)
            {
                Logger.LogWarning("User {UserId} already has a {Status} request for skill {SkillId}", 
                    request.UserId, existingRequest.Status, request.SkillId);
                return Error($"You already have a {existingRequest.Status} request for this skill");
            }

            // Generate ThreadId for grouping requests between users for this skill
            var threadId = $"{request.UserId}:{request.TargetUserId}:{request.SkillId}";
            var hashedThreadId = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(threadId));
            var threadIdGuid = new Guid(hashedThreadId.Take(16).ToArray()).ToString();

            var matchRequest = new MatchRequest
            {
                RequesterId = request.UserId ?? "",
                TargetUserId = request.TargetUserId,
                SkillId = request.SkillId,
                ThreadId = threadIdGuid,
                Description = request.Description ?? request.Message,
                Status = "pending",
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
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                ViewCount = 0,
                MatchAttempts = 0,
                ResponseMessage = null,
                RespondedAt = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.MatchRequests.Add(matchRequest);
            await _dbContext.SaveChangesAsync(cancellationToken);

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
                totalSessions: matchRequest.TotalSessions ?? 1,
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
                Status: matchRequest.Status,
                CreatedAt: matchRequest.CreatedAt,
                ThreadId: matchRequest.ThreadId ?? ""
            );

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating match request for UserId {UserId}", request.UserId);
            return Error("An error occurred while creating the match request");
        }
    }
}