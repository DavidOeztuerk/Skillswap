using Contracts.User.Responses.LinkedIn;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.SocialConnections;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.SocialConnections;

/// <summary>
/// Handler for getting user's LinkedIn connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class GetLinkedInConnectionQueryHandler(
    IUserLinkedInConnectionRepository repository,
    ILogger<GetLinkedInConnectionQueryHandler> logger)
    : BaseQueryHandler<GetLinkedInConnectionQuery, LinkedInConnectionResponse>(logger)
{
    private readonly IUserLinkedInConnectionRepository _repository = repository;

    public override async Task<ApiResponse<LinkedInConnectionResponse>> Handle(
        GetLinkedInConnectionQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogDebug("Getting LinkedIn connection for user {UserId}", request.UserId);

        var connection = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);
        if (connection == null)
        {
            return NotFound("LinkedIn connection not found");
        }

        var response = MapToResponse(connection);
        return Success(response);
    }

    private static LinkedInConnectionResponse MapToResponse(UserLinkedInConnection connection)
    {
        return new LinkedInConnectionResponse(
            connection.Id,
            connection.LinkedInId,
            connection.ProfileUrl,
            connection.LinkedInEmail,
            connection.IsVerified,
            connection.VerifiedAt,
            connection.LastSyncAt,
            connection.ImportedExperienceCount,
            connection.ImportedEducationCount,
            connection.AutoSyncEnabled,
            connection.CreatedAt);
    }
}
