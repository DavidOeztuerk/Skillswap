using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetFavoriteSkillsQueryHandler(
    IUserSkillsRepository userSkillsRepository,
    ILogger<GetFavoriteSkillsQueryHandler> logger)
    : BaseQueryHandler<GetFavoriteSkillsQuery, List<string>>(logger)
{
    private readonly IUserSkillsRepository _userSkillsRepository = userSkillsRepository;

    public override async Task<ApiResponse<List<string>>> Handle(GetFavoriteSkillsQuery request, CancellationToken cancellationToken)
    {
        var favoriteSkills = await _userSkillsRepository.GetFavoriteSkills(request.UserId, cancellationToken);
        return Success(favoriteSkills);
    }
}
