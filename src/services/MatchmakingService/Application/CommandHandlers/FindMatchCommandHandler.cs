using CQRS.Handlers;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EventSourcing;

namespace MatchmakingService.Application.CommandHandlers;

public class FindMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<FindMatchCommandHandler> logger)
    : BaseCommandHandler<FindMatchCommand, FindMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<FindMatchResponse>> Handle(
        FindMatchCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Find compatible matches
            var compatibleMatches = await FindCompatibleMatchesAsync(request, cancellationToken);

            if (compatibleMatches.Any())
            {
                var bestMatch = compatibleMatches.OrderByDescending(m => m.CompatibilityScore).First();

                // Create match
                var match = new Match
                {
                    OfferedSkillId = request.IsOffering ? request.SkillId : bestMatch.SkillId,
                    RequestedSkillId = request.IsOffering ? bestMatch.SkillId : request.SkillId,
                    OfferingUserId = request.IsOffering ? request.UserId! : bestMatch.UserId,
                    RequestingUserId = request.IsOffering ? bestMatch.UserId : request.UserId!,
                    OfferedSkillName = request.IsOffering ? request.SkillName : bestMatch.SkillName,
                    RequestedSkillName = request.IsOffering ? bestMatch.SkillName : request.SkillName,
                    CompatibilityScore = bestMatch.CompatibilityScore,
                    MatchReason = bestMatch.MatchReason,
                    CreatedBy = request.UserId
                };

                _dbContext.Matches.Add(match);

                // Remove or update the matched request
                var matchedRequest = await _dbContext.MatchRequests
                    .FindAsync(bestMatch.Id);
                if (matchedRequest != null)
                {
                    matchedRequest.Status = "Matched";
                    matchedRequest.UpdatedAt = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);

                // Publish domain event
                await _eventPublisher.Publish(new MatchCreatedDomainEvent(
                    match.Id,
                    match.OfferedSkillId,
                    match.RequestedSkillId,
                    match.OfferingUserId,
                    match.RequestingUserId,
                    match.CompatibilityScore), cancellationToken);

                return Success(new FindMatchResponse(
                    match.Id,
                    true,
                    request.IsOffering ? match.RequestingUserId : match.OfferingUserId,
                    request.IsOffering ? match.RequestedSkillId : match.OfferedSkillId,
                    match.CompatibilityScore,
                    "Match found successfully"));
            }
            else
            {
                // Create match request for future matching
                var matchRequest = new MatchRequest
                {
                    UserId = request.UserId!,
                    SkillId = request.SkillId,
                    SkillName = request.SkillName,
                    IsOffering = request.IsOffering,
                    PreferredTags = request.PreferredTags ?? new List<string>(),
                    PreferredLocation = request.PreferredLocation,
                    RemoteOnly = request.RemoteOnly,
                    MaxDistanceKm = request.MaxDistanceKm,
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                    CreatedBy = request.UserId
                };

                _dbContext.MatchRequests.Add(matchRequest);
                await _dbContext.SaveChangesAsync(cancellationToken);

                return Success(new FindMatchResponse(
                    null,
                    false,
                    null,
                    null,
                    null,
                    "No matches found. Your request has been saved for future matching."));
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error finding match for skill {SkillId}", request.SkillId);
            return Error("An error occurred while finding matches");
        }
    }

    private async Task<List<CompatibleMatch>> FindCompatibleMatchesAsync(
        FindMatchCommand request,
        CancellationToken cancellationToken)
    {
        var compatibleMatches = new List<CompatibleMatch>();

        // Find opposite type matches (if offering, find requesting and vice versa)
        var oppositeRequests = await _dbContext.MatchRequests
            .Where(mr => mr.UserId != request.UserId &&
                        mr.IsOffering != request.IsOffering &&
                        mr.Status == "Active" &&
                        !mr.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var oppositeRequest in oppositeRequests)
        {
            var compatibility = CalculateCompatibility(request, oppositeRequest);

            if (compatibility.Score >= 0.3) // Minimum compatibility threshold
            {
                compatibleMatches.Add(new CompatibleMatch
                {
                    Id = oppositeRequest.Id,
                    UserId = oppositeRequest.UserId,
                    SkillId = oppositeRequest.SkillId,
                    SkillName = oppositeRequest.SkillName,
                    CompatibilityScore = compatibility.Score,
                    MatchReason = compatibility.Reason
                });
            }
        }

        return compatibleMatches;
    }

    private static (double Score, string Reason) CalculateCompatibility(
        FindMatchCommand request,
        MatchRequest oppositeRequest)
    {
        double score = 0.0;
        var reasons = new List<string>();

        // Exact skill name match
        if (string.Equals(request.SkillName, oppositeRequest.SkillName, StringComparison.OrdinalIgnoreCase))
        {
            score += 0.6;
            reasons.Add("Exact skill match");
        }
        else if (request.SkillName.Contains(oppositeRequest.SkillName, StringComparison.OrdinalIgnoreCase) ||
                 oppositeRequest.SkillName.Contains(request.SkillName, StringComparison.OrdinalIgnoreCase))
        {
            score += 0.4;
            reasons.Add("Similar skill match");
        }

        // Tag compatibility
        if (request.PreferredTags != null && oppositeRequest.PreferredTags.Any())
        {
            var commonTags = request.PreferredTags.Intersect(oppositeRequest.PreferredTags, StringComparer.OrdinalIgnoreCase).Count();
            if (commonTags > 0)
            {
                score += 0.2 * (commonTags / (double)Math.Max(request.PreferredTags.Count, oppositeRequest.PreferredTags.Count));
                reasons.Add($"Common interests ({commonTags} tags)");
            }
        }

        // Location compatibility
        if (!request.RemoteOnly && !oppositeRequest.RemoteOnly)
        {
            if (!string.IsNullOrEmpty(request.PreferredLocation) && !string.IsNullOrEmpty(oppositeRequest.PreferredLocation))
            {
                if (string.Equals(request.PreferredLocation, oppositeRequest.PreferredLocation, StringComparison.OrdinalIgnoreCase))
                {
                    score += 0.2;
                    reasons.Add("Same location");
                }
            }
        }
        else if (request.RemoteOnly && oppositeRequest.RemoteOnly)
        {
            score += 0.1;
            reasons.Add("Both prefer remote");
        }

        return (Math.Round(score, 2), string.Join(", ", reasons));
    }

    private class CompatibleMatch
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string SkillId { get; set; } = string.Empty;
        public string SkillName { get; set; } = string.Empty;
        public double CompatibilityScore { get; set; }
        public string MatchReason { get; set; } = string.Empty;
    }
}

