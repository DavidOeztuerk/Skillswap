// using UserService.Application.Queries;
// using CQRS.Handlers;
// using CQRS.Models;
// using UserService.Domain.Repositories;
// using Microsoft.Extensions.Logging;

// namespace UserService.Api.Application.QueryHandlers;

// public class ValidateUserCredentialsQueryHandler(
//     IUserProfileRepository userRepository,
//     ILogger<ValidateUserCredentialsQueryHandler> logger)
//     : BaseQueryHandler<ValidateUserCredentialsQuery, UserValidationResponse>(logger)
// {
//     private readonly IUserProfileRepository _userRepository = userRepository;

//     public override async Task<ApiResponse<UserValidationResponse>> Handle(
//         ValidateUserCredentialsQuery request,
//         CancellationToken cancellationToken)
//     {
//         try
//         {
//             var user = await _userRepository.GetUserByEmail(request.Email, cancellationToken);

//             if (user == null || user.IsDeleted)
//             {
//                 var response = new UserValidationResponse(
//                     false, null, "User not found", false, false, null);
//                 return Success(response);
//             }

//             // Check if account is locked
//             if (user.IsAccountLocked)
//             {
//                 var response = new UserValidationResponse(
//                     false, user.Id, "Account is locked", false, true, user.AccountLockedUntil);
//                 return Success(response);
//             }

//             // Validate password using repository method
//             var isPasswordValid = await _userRepository.ValidatePassword(request.Email, request.Password, cancellationToken);
            
//             if (!isPasswordValid)
//             {
//                 // Increment failed attempts
//                 user.FailedLoginAttempts++;

//                 // Lock account after 5 failed attempts
//                 if (user.FailedLoginAttempts >= 5)
//                 {
//                     user.LockAccount(TimeSpan.FromMinutes(30), "Too many failed login attempts");
//                 }

//                 await _userRepository.UpdateUser(user, cancellationToken);

//                 var response = new UserValidationResponse(
//                     false, user.Id, "Invalid password", false, user.IsAccountLocked, user.AccountLockedUntil);
//                 return Success(response);
//             }

//             // Reset failed attempts on successful validation
//             if (user.FailedLoginAttempts > 0)
//             {
//                 user.FailedLoginAttempts = 0;
//                 await _userRepository.UpdateUser(user, cancellationToken);
//             }

//             var validResponse = new UserValidationResponse(
//                 true,
//                 user.Id,
//                 "Valid credentials",
//                 !user.EmailVerified,
//                 false,
//                 null);

//             return Success(validResponse);
//         }
//         catch (Exception ex)
//         {
//             Logger.LogError(ex, "Error validating credentials for email {Email}", request.Email);
//             return Error("An error occurred while validating credentials");
//         }
//     }
// }
