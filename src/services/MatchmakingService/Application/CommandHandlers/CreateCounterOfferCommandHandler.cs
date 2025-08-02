// using CQRS.Handlers;
// using Infrastructure.Models;
// using EventSourcing;
// using Microsoft.EntityFrameworkCore;
// using MatchmakingService.Application.Commands;
// using MatchmakingService;
// using MatchmakingService.Domain.Entities;

// namespace MatchmakingService.Application.CommandHandlers;

// public class CreateCounterOfferCommandHandler(
//     MatchmakingDbContext dbContext,
//     IDomainEventPublisher eventPublisher,
//     ILogger<CreateCounterOfferCommandHandler> logger)
//     : BaseCommandHandler<CreateCounterOfferCommand, CounterOfferResponse>(logger)
// {
//     private readonly MatchmakingDbContext _dbContext = dbContext;
//     private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

//     public override async Task<ApiResponse<CounterOfferResponse>> Handle(
//         CreateCounterOfferCommand request,
//         CancellationToken cancellationToken)
//     {
//         try
//         {
//             // Validate required fields
//             if (string.IsNullOrWhiteSpace(request.UserId) ||
//                 string.IsNullOrWhiteSpace(request.RequestId) ||
//                 string.IsNullOrWhiteSpace(request.Message))
//             {
//                 return Error("Missing required fields");
//             }

//             Logger.LogInformation("Creating counter offer for request: {RequestId} by user: {UserId}", 
//                 request.RequestId, request.UserId);

//             // Find the original request
//             var originalRequest = await _dbContext.MatchRequests
//                 .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

//             if (originalRequest == null)
//             {
//                 Logger.LogWarning("Original request not found: {RequestId}", request.RequestId);
//                 return Error($"Request {request.RequestId} not found");
//             }

//             // Create counter offer
//             var counterOffer = new MatchRequest
//             {
//                 Id = Guid.NewGuid().ToString(),
//                 RequesterId = request.UserId,
//                 TargetUserId = originalRequest.RequesterId,
//                 SkillId = originalRequest.SkillId,
//                 // SkillName = originalRequest.SkillName,
//                 Description = originalRequest.Description,
//                 Message = request.Message,
//                 Status = "Pending",
//                 // IsCounterOffer = true,
//                 // ParentRequestId = originalRequest.Id,
//                 ThreadId = originalRequest.ThreadId ?? Guid.NewGuid().ToString(),
                
//                 // Counter offer specific data
//                 IsSkillExchange = request.IsSkillExchange,
//                 ExchangeSkillId = request.ExchangeSkillId,
//                 // ExchangeSkillName = request.ExchangeSkillName,
//                 IsMonetaryOffer = request.IsMonetaryOffer,
//                 OfferedAmount = request.OfferedAmount,
//                 PreferredDays = request.PreferredDays ?? new List<string>(),
//                 PreferredTimes = request.PreferredTimes ?? new List<string>(),
//                 SessionDurationMinutes = request.SessionDurationMinutes ?? 60,
//                 TotalSessions = request.TotalSessions ?? 1,
                
//                 CreatedAt = DateTime.UtcNow,
//                 UpdatedAt = DateTime.UtcNow
//             };

//             // Update thread ID on original request if not set
//             if (string.IsNullOrEmpty(originalRequest.ThreadId))
//             {
//                 originalRequest.ThreadId = counterOffer.ThreadId;
//             }

//             _dbContext.MatchRequests.Add(counterOffer);
//             await _dbContext.SaveChangesAsync(cancellationToken);

//             Logger.LogInformation("Counter offer created successfully: {CounterOfferId}", counterOffer.Id);

//             var response = new CounterOfferResponse(
//                 Id: counterOffer.Id,
//                 RequestId: counterOffer.RequesterId ?? "",
//                 RequesterId: counterOffer.RequesterId,
//                 Message: counterOffer.Message,
//                 IsSkillExchange: counterOffer.IsSkillExchange,
//                 ExchangeSkillId: counterOffer.ExchangeSkillId,
//                 // ExchangeSkillName: counterOffer.ExchangeSkillName,
//                 IsMonetaryOffer: counterOffer.IsMonetaryOffer,
//                 OfferedAmount: counterOffer.OfferedAmount,
//                 PreferredDays: counterOffer.PreferredDays,
//                 PreferredTimes: counterOffer.PreferredTimes,
//                 SessionDurationMinutes: counterOffer.SessionDurationMinutes ?? 60,
//                 TotalSessions: counterOffer.TotalSessions ?? 1,
//                 Status: counterOffer.Status,
//                 CreatedAt: counterOffer.CreatedAt);

//             return Success(response);
//         }
//         catch (Exception ex)
//         {
//             Logger.LogError(ex, "Error creating counter offer for request: {RequestId}", request.RequestId);
//             return Error("An error occurred while creating the counter offer");
//         }
//     }
// }