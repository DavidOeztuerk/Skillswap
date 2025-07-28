using CQRS.Handlers;
using EventSourcing;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RejectMatchCommandHandler> logger)
    : BaseCommandHandler<CreateMatchRequestCommand, MatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<MatchRequestResponse>> Handle(
        CreateMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.UserId) ||
                string.IsNullOrWhiteSpace(request.SkillId) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Error("Missing required fields");
            }

            // MatchRequest is a general request - no target user validation needed

            var matchRequest = new MatchRequest
            {
                RequesterId = request.UserId ?? "",
                // No TargetUserId in MatchRequest system
                SkillId = request.SkillId,
                Description = request.Description,
                Status = "Pending",
                Message = request.Message,
                ExpiresAt = DateTime.UtcNow.AddDays(7), // Expires in 7 days
                ViewCount = 0,
                MatchAttempts = 0,
                ResponseMessage = null,
                RespondedAt = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.MatchRequests.Add(matchRequest);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Optionally: Publish domain event
            // await _eventPublisher.Publish(new MatchRequestCreatedDomainEvent(matchRequest.Id, ...), cancellationToken);

            var response = new MatchRequestResponse(
                RequestId: matchRequest.Id,
                RequesterId: matchRequest.RequesterId,
                TargetUserId: string.Empty, // No target user in MatchRequest system
                SkillId: matchRequest.SkillId,
                Description: matchRequest.Description ?? string.Empty,
                Message: matchRequest.Message,
                Status: matchRequest.Status,
                CreatedAt: matchRequest.CreatedAt,
                RespondedAt: matchRequest.RespondedAt,
                ExpiresAt: matchRequest.ExpiresAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating match request for UserId {UserId}", request.UserId);
            return Error("An error occurred while creating the match request");
        }
    }
}
