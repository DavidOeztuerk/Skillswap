using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Contracts.Matchmaking.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateCounterOfferCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateCounterOfferCommandHandler> logger)
    : BaseCommandHandler<CreateCounterOfferCommand, CreateMatchRequestResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    // Counter-Offer Limits:
    // - Initiator: 1 Initial + 2 Counter-Offers = 3 total
    // - Owner: 3 Counter-Offers = 3 total
    // - Thread total: 6 max
    private const int MaxInitiatorRequests = 3;
    private const int MaxOwnerRequests = 3;
    private const int MaxTotalRequests = 6;

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
            var originalRequest = await _unitOfWork.MatchRequests.Query
                .FirstOrDefaultAsync(mr => mr.Id == request.OriginalRequestId, cancellationToken);

            if (originalRequest == null)
            {
                Logger.LogWarning("Original request not found: {RequestId}", request.OriginalRequestId);
                return Error($"Request {request.OriginalRequestId} not found", ErrorCodes.ResourceNotFound);
            }

            // Get thread ID (use existing or will create new)
            var threadId = originalRequest.ThreadId ?? originalRequest.Id;

            // ========================================================================
            // COUNTER-OFFER LIMIT CHECK
            // ========================================================================
            var requestsInThread = await _unitOfWork.MatchRequests
                .GetRequestsByThreadIdAsync(threadId, cancellationToken);

            // If thread doesn't exist yet (first counter-offer), include the original request
            if (requestsInThread.Count == 0)
            {
                requestsInThread = [originalRequest];
            }

            // Determine who is the initiator (first request creator) and owner (target)
            var firstRequest = requestsInThread.OrderBy(r => r.CreatedAt).First();
            var initiatorUserId = firstRequest.RequesterId;
            var ownerUserId = firstRequest.TargetUserId;

            // Count requests per party
            var initiatorRequestCount = requestsInThread.Count(r => r.RequesterId == initiatorUserId);
            var ownerRequestCount = requestsInThread.Count(r => r.RequesterId == ownerUserId);
            var totalRequestCount = requestsInThread.Count;

            Logger.LogDebug(
                "Thread {ThreadId} request counts - Initiator: {InitiatorCount}, Owner: {OwnerCount}, Total: {Total}",
                threadId, initiatorRequestCount, ownerRequestCount, totalRequestCount);

            // Check total limit
            if (totalRequestCount >= MaxTotalRequests)
            {
                Logger.LogWarning("Thread {ThreadId} has reached maximum requests ({Max})",
                    threadId, MaxTotalRequests);
                return Error(
                    "Maximale Verhandlungsrunden erreicht. Keine weitere Anfragen möglich.",
                    ErrorCodes.ValidationFailed);
            }

            // Check per-party limits
            if (request.UserId == initiatorUserId && initiatorRequestCount >= MaxInitiatorRequests)
            {
                Logger.LogWarning("Initiator {UserId} has reached max requests ({Max}) in thread {ThreadId}",
                    request.UserId, MaxInitiatorRequests, threadId);
                return Error(
                    "Sie haben die maximale Anzahl von 3 Anfragen erreicht (1 Initial + 2 Gegenangebote).",
                    ErrorCodes.ValidationFailed);
            }

            if (request.UserId == ownerUserId && ownerRequestCount >= MaxOwnerRequests)
            {
                Logger.LogWarning("Owner {UserId} has reached max counter-offers ({Max}) in thread {ThreadId}",
                    request.UserId, MaxOwnerRequests, threadId);
                return Error(
                    "Sie haben die maximale Anzahl von 3 Gegenangeboten erreicht.",
                    ErrorCodes.ValidationFailed);
            }

            // ========================================================================
            // END LIMIT CHECK
            // ========================================================================

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
                Status = MatchRequestStatus.Pending,
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

            await _unitOfWork.MatchRequests.CreateAsync(counterOffer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Counter offer created successfully: {CounterOfferId}", counterOffer.Id);

            var response = new CreateMatchRequestResponse(
                RequestId: counterOffer.Id,
                Status: counterOffer.Status.ToString(),
                CreatedAt: counterOffer.CreatedAt,
                ThreadId: counterOffer.ThreadId ?? ""
            );

            return Success(response, "Counter offer created successfully");
        }
    }
}