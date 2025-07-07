using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Queries.Favorites;

namespace UserService.Application.QueryHandlers.Favorites;

public class GetFavoriteSkillsQueryHandler(
    UserDbContext dbContext,
    ILogger<GetFavoriteSkillsQueryHandler> logger) 
    : BaseQueryHandler<GetFavoriteSkillsQuery, List<string>>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<List<string>>> Handle(GetFavoriteSkillsQuery request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync([request.UserId], cancellationToken);
        if (user == null)
            return NotFound("User not found");
        return Success(user.FavoriteSkillIds);
    }
}
