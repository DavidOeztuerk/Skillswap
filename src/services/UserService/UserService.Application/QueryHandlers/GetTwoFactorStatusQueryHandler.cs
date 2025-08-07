using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using CQRS.Models;
using Contracts.User.Responses;

namespace UserService.Application.QueryHandlers;

public class GetTwoFactorStatusQueryHandler(
    ITwoFactorRepository twoFactorRepository,
    ILogger<GetTwoFactorStatusQueryHandler> logger)
    : BaseQueryHandler<GetTwoFactorStatusQuery, GetTwoFactorStatusResponse>(logger)
{
    private readonly ITwoFactorRepository _twoFactorRepository = twoFactorRepository;

    public override async Task<ApiResponse<GetTwoFactorStatusResponse>> Handle(GetTwoFactorStatusQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting two-factor status for user {UserId}", request.UserId);

        var (hasSecret, isEnabled) = await _twoFactorRepository.GetTwoFactorStatus(request.UserId, cancellationToken);

        return Success(new GetTwoFactorStatusResponse(
            isEnabled,
            hasSecret,
            isEnabled ? DateTime.UtcNow : null,
            new List<string>()
        ));
    }
}