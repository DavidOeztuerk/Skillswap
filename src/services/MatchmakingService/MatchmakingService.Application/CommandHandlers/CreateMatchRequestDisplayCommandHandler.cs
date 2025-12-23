using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Contracts.Matchmaking.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class CreateMatchRequestDisplayCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateMatchRequestDisplayCommandHandler> logger)
    : BaseCommandHandler<CreateMatchRequestCommand, CreateMatchRequestResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateMatchRequestResponse>> Handle(
        CreateMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.UserId) ||
                string.IsNullOrWhiteSpace(request.SkillId) ||
                string.IsNullOrWhiteSpace(request.TargetUserId) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Error("Missing required fields", ErrorCodes.RequiredFieldMissing);
            }

            // Prevent users from requesting their own skills
            if (request.TargetUserId == request.UserId)
            {
                return Error("You cannot create a match request for your own skill", ErrorCodes.BusinessRuleViolation);
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

            await _unitOfWork.MatchRequests.CreateAsync(matchRequest, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Return simple response - UI will refresh to get full data
            var response = new CreateMatchRequestResponse(
                RequestId: matchRequest.Id,
                Status: matchRequest.Status,
                CreatedAt: matchRequest.CreatedAt,
                ThreadId: matchRequest.ThreadId ?? ""
            );

            return Success(response);
        }
    }
}