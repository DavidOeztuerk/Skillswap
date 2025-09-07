using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Contracts.Matchmaking.Responses;
using Core.Common.Exceptions;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateCounterOfferCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateCounterOfferCommandHandler> logger)
    : BaseCommandHandler<CreateCounterOfferCommand, CreateMatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateMatchRequestResponse>> Handle(
        CreateCounterOfferCommand request,
        CancellationToken cancellationToken)
    {
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.UserId) ||
                string.IsNullOrWhiteSpace(request.OriginalRequestId) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Error("Missing required fields", ErrorCodes.RequiredFieldMissing);
            }

            Logger.LogInformation("Creating counter offer for request: {RequestId} by user: {UserId}", 
                request.OriginalRequestId, request.UserId);

            // Find the original request
            var originalRequest = await _dbContext.MatchRequests
                .FirstOrDefaultAsync(mr => mr.Id == request.OriginalRequestId, cancellationToken);

            if (originalRequest == null)
            {
                Logger.LogWarning("Original request not found: {RequestId}", request.OriginalRequestId);
                return Error($"Request {request.OriginalRequestId} not found", ErrorCodes.ResourceNotFound);
            }

            // Mark original request as countered
            originalRequest.MarkAsCounterOffered();

            // Create counter offer as new request in same thread
            var counterOffer = new MatchRequest
            {
                Id = Guid.NewGuid().ToString(),
                RequesterId = request.UserId!,
                TargetUserId = originalRequest.RequesterId,
                SkillId = originalRequest.SkillId,
                Description = "Counter-Offer: " + (originalRequest.Description ?? ""),
                Message = request.Message,
                Status = "Pending",
                ThreadId = originalRequest.ThreadId ?? Guid.NewGuid().ToString(),
                
                // Counter offer specific data
                IsSkillExchange = request.IsSkillExchange,
                ExchangeSkillId = request.ExchangeSkillId,
                IsMonetaryOffer = request.IsMonetary,
                OfferedAmount = request.OfferedAmount,
                Currency = request.Currency ?? "EUR",
                PreferredDays = request.PreferredDays ?? new List<string>(),
                PreferredTimes = request.PreferredTimes ?? new List<string>(),
                SessionDurationMinutes = request.SessionDurationMinutes ?? 60,
                TotalSessions = request.TotalSessions ?? 1,
                
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            // Update thread ID on original request if not set
            if (string.IsNullOrEmpty(originalRequest.ThreadId))
            {
                originalRequest.ThreadId = counterOffer.ThreadId;
            }

            _dbContext.MatchRequests.Add(counterOffer);
            await _dbContext.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Counter offer created successfully: {CounterOfferId}", counterOffer.Id);

            var response = new CreateMatchRequestResponse(
                RequestId: counterOffer.Id,
                Status: counterOffer.Status,
                CreatedAt: counterOffer.CreatedAt,
                ThreadId: counterOffer.ThreadId ?? ""
            );

            return Success(response, "Counter offer created successfully");
        }
    }
}