using Contracts.User.Responses.Xing;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.SocialConnections;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.SocialConnections;

/// <summary>
/// Handler for getting user's Xing connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class GetXingConnectionQueryHandler(
    IUserXingConnectionRepository repository,
    ILogger<GetXingConnectionQueryHandler> logger)
    : BaseQueryHandler<GetXingConnectionQuery, XingConnectionResponse>(logger)
{
    private readonly IUserXingConnectionRepository _repository = repository;

    public override async Task<ApiResponse<XingConnectionResponse>> Handle(
        GetXingConnectionQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogDebug("Getting Xing connection for user {UserId}", request.UserId);

        var connection = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);
        if (connection == null)
        {
            return NotFound("Xing connection not found");
        }

        var response = MapToResponse(connection);
        return Success(response);
    }

    private static XingConnectionResponse MapToResponse(UserXingConnection connection)
    {
        return new XingConnectionResponse(
            connection.Id,
            connection.XingId,
            connection.ProfileUrl,
            connection.XingEmail,
            connection.IsVerified,
            connection.VerifiedAt,
            connection.LastSyncAt,
            connection.ImportedExperienceCount,
            connection.ImportedEducationCount,
            connection.AutoSyncEnabled,
            connection.CreatedAt);
    }
}
