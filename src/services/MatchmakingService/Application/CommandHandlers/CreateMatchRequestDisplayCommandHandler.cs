using CQRS.Handlers;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Contracts.Matchmaking.Responses;
using CQRS.Models;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateMatchRequestDisplayCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateMatchRequestDisplayCommandHandler> logger)
    : BaseCommandHandler<CreateMatchRequestCommand, CreateMatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

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
                Status = "Pending",
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

            // Return simple response - UI will refresh to get full data
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