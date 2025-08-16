// using Microsoft.Extensions.Logging;
// using CQRS.Models;
// using CQRS.Handlers;
// using UserService.Domain.Repositories;

// namespace UserService.Application.Queries.Handlers;

// public class GetUserFavoritesQueryHandler(
//     IUserRepository userRepository,
//     ILogger<GetUserFavoritesQueryHandler> logger)
//     : BasePagedQueryHandler<GetUserFavoritesQuery, string>(logger)
// {
//     private readonly IUserRepository _userRepository = userRepository;

//     public override async Task<PagedResponse<string>> Handle(GetUserFavoritesQuery request, CancellationToken cancellationToken)
//     {
//         try
//         {
//             var user = await _userRepository.GetUserById(request.UserId, cancellationToken);

//             if (user == null)
//             {
//                 return Error("User not found");
//             }

//             var userFavoriteSkills = user.FavoriteSkillIds
//                 .Skip((request.PageNumber - 1) * request.PageSize)
//                 .Take(request.PageSize)
//                 .ToList();

//             return Success(userFavoriteSkills, request.PageNumber, request.PageSize, user.FavoriteSkillIds.Count);
//         }
//         catch (Exception ex)
//         {
//             Logger.LogError(ex, "Error getting user favorites for user {UserId}", request.UserId);
//             return Error("An error occurred while getting favorites");
//         }
//     }
// }


//   1. Email-Problem ❌

//   Ursache: SMTP Credentials in .env sind noch Platzhalter
//   SMTP_USERNAME=your-email@gmail.com
//   SMTP_PASSWORD=your-app-password
//   Lösung: Du musst deine echten Gmail-Credentials eintragen:
//   - Gehe zu Google Account Settings
//   - Erstelle ein App-Password für "Mail"
//   - Trage Email und App-Password in .env ein