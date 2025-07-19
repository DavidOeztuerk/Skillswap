//using Contracts.User.Requests;
//using Contracts.User.Responses;
//using Contracts.Common;
//using UserService.Application.Commands;
//using UserService.Application.Queries;
//using Infrastructure.Security;

//namespace UserService.Application.Mappers;

///// <summary>
///// Maps between User API contracts and CQRS commands/queries
///// </summary>
//public class UserContractMapper : IUserContractMapper
//{
//    public RegisterUserCommand MapToCommand(RegisterUserRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);

//        return new RegisterUserCommand(
//            request.Email,
//            request.Password,
//            request.FirstName,
//            request.LastName,
//            request.UserName,
//            request.ReferralCode)
//        {
//            UserId = userId,
//            Timestamp = DateTime.UtcNow
//        };
//    }

//    public RegisterUserResponse MapToResponse(RegisterUserCommandResponse commandResponse)
//    {
//        ArgumentNullException.ThrowIfNull(commandResponse);

//        return new RegisterUserResponse(
//            commandResponse.UserId,
//            commandResponse.Email,
//            commandResponse.FirstName,
//            commandResponse.LastName,
//            commandResponse.UserName,
//            commandResponse.Tokens.AccessToken,
//            commandResponse.Tokens.RefreshToken,
//            commandResponse.Tokens.TokenType,
//            commandResponse.Tokens.ExpiresAt,
//            commandResponse.EmailVerificationRequired);
//    }

//    public LoginUserCommand MapToCommand(LoginUserRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);

//        return new LoginUserCommand(
//            request.Email,
//            request.Password,
//            request.RememberMe,
//            request.TwoFactorCode)
//        {
//            UserId = userId,
//            Timestamp = DateTime.UtcNow
//        };
//    }

//    public LoginUserResponse MapToResponse(LoginUserCommandResponse commandResponse)
//    {
//        ArgumentNullException.ThrowIfNull(commandResponse);

//        return new LoginUserResponse(
//            commandResponse.UserId,
//            commandResponse.Email,
//            commandResponse.FirstName,
//            commandResponse.LastName,
//            commandResponse.UserName,
//            commandResponse.Tokens.AccessToken,
//            commandResponse.Tokens.RefreshToken,
//            commandResponse.Tokens.TokenType,
//            commandResponse.Tokens.ExpiresAt,
//            commandResponse.Roles,
//            commandResponse.TwoFactorRequired,
//            commandResponse.EmailVerified);
//    }

//    public RefreshTokenCommand MapToCommand(RefreshTokenRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);

//        return new RefreshTokenCommand(request.RefreshToken)
//        {
//            UserId = userId,
//            Timestamp = DateTime.UtcNow
//        };
//    }

//    public RefreshTokenResponse MapToResponse(RefreshTokenCommandResponse commandResponse)
//    {
//        ArgumentNullException.ThrowIfNull(commandResponse);

//        return new RefreshTokenResponse(
//            commandResponse.Tokens.AccessToken,
//            commandResponse.Tokens.RefreshToken,
//            commandResponse.Tokens.TokenType,
//            commandResponse.Tokens.ExpiresAt);
//    }

//    public ChangePasswordCommand MapToCommand(ChangePasswordRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);
//        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

//        return new ChangePasswordCommand(
//            request.CurrentPassword,
//            request.NewPassword)
//        {
//            UserId = userId,
//            Timestamp = DateTime.UtcNow
//        };
//    }

//    public ChangePasswordResponse MapToResponse(ChangePasswordCommandResponse commandResponse)
//    {
//        ArgumentNullException.ThrowIfNull(commandResponse);

//        return new ChangePasswordResponse(
//            commandResponse.Success,
//            commandResponse.Message ?? "Password changed successfully");
//    }

//    public GetUserProfileQuery MapToQuery(GetUserProfileRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);

//        return new GetUserProfileQuery(request.UserId);
//    }

//    public UserProfileResponse MapToResponse(UserProfileQueryResponse queryResponse)
//    {
//        ArgumentNullException.ThrowIfNull(queryResponse);

//        return new UserProfileResponse(
//            queryResponse.UserId,
//            queryResponse.Email,
//            queryResponse.FirstName,
//            queryResponse.LastName,
//            queryResponse.UserName,
//            queryResponse.PhoneNumber,
//            queryResponse.Bio,
//            queryResponse.TimeZone,
//            queryResponse.Roles,
//            queryResponse.EmailVerified,
//            queryResponse.AccountStatus,
//            queryResponse.CreatedAt,
//            queryResponse.LastLoginAt,
//            queryResponse.Preferences);
//    }

//    public SearchUsersQuery MapToQuery(SearchUsersRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);

//        return new SearchUsersQuery(
//            request.SearchTerm,
//            request.Skills,
//            request.Location,
//            request.IsAvailable,
//            request.MinRating,
//            request.MaxRating,
//            request.SortBy,
//            request.SortDescending,
//            request.PageNumber,
//            request.PageSize);
//    }

//    public SearchUsersResponse MapToResponse(SearchUsersQueryResponse queryResponse)
//    {
//        ArgumentNullException.ThrowIfNull(queryResponse);

//        var users = queryResponse.Users.Select(u => new UserSummaryResponse(
//            u.UserId,
//            u.FirstName,
//            u.LastName,
//            u.UserName,
//            u.Skills,
//            u.Location,
//            u.Rating,
//            u.ReviewCount,
//            u.IsAvailable,
//            u.JoinedAt)).ToList();

//        return new SearchUsersResponse(
//            users,
//            queryResponse.PageNumber,
//            queryResponse.PageSize,
//            queryResponse.TotalCount,
//            queryResponse.TotalPages,
//            queryResponse.HasNextPage,
//            queryResponse.HasPreviousPage);
//    }

//    public UpdateUserProfileCommand MapToCommand(UpdateUserProfileRequest request, string? userId = null)
//    {
//        ArgumentNullException.ThrowIfNull(request);
//        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

//        return new UpdateUserProfileCommand(
//            request.FirstName,
//            request.LastName,
//            request.PhoneNumber,
//            request.Bio,
//            request.TimeZone,
//            request.Location,
//            request.Preferences)
//        {
//            UserId = userId,
//            Timestamp = DateTime.UtcNow
//        };
//    }

//    public UpdateUserProfileResponse MapToResponse(UpdateUserProfileCommandResponse commandResponse)
//    {
//        ArgumentNullException.ThrowIfNull(commandResponse);

//        return new UpdateUserProfileResponse(
//            commandResponse.UserId,
//            commandResponse.Email,
//            commandResponse.FirstName,
//            commandResponse.LastName,
//            commandResponse.UserName,
//            commandResponse.PhoneNumber,
//            commandResponse.Bio,
//            commandResponse.TimeZone,
//            commandResponse.Location,
//            commandResponse.UpdatedAt);
//    }
//}

/////// <summary>
/////// Interface for User service contract mapping
/////// </summary>
////public interface IUserContractMapper
////{
////    RegisterUserCommand MapToCommand(RegisterUserRequest request, string? userId = null);
////    RegisterUserResponse MapToResponse(RegisterUserCommandResponse commandResponse);
    
////    LoginUserCommand MapToCommand(LoginUserRequest request, string? userId = null);
////    LoginUserResponse MapToResponse(LoginUserCommandResponse commandResponse);
    
////    RefreshTokenCommand MapToCommand(RefreshTokenRequest request, string? userId = null);
////    RefreshTokenResponse MapToResponse(RefreshTokenCommandResponse commandResponse);
    
////    ChangePasswordCommand MapToCommand(ChangePasswordRequest request, string? userId = null);
////    ChangePasswordResponse MapToResponse(ChangePasswordCommandResponse commandResponse);
    
////    GetUserProfileQuery MapToQuery(GetUserProfileRequest request, string? userId = null);
////    UserProfileResponse MapToResponse(UserProfileQueryResponse queryResponse);
    
////    SearchUsersQuery MapToQuery(SearchUsersRequest request, string? userId = null);
////    SearchUsersResponse MapToResponse(SearchUsersQueryResponse queryResponse);
    
////    UpdateUserProfileCommand MapToCommand(UpdateUserProfileRequest request, string? userId = null);
////    UpdateUserProfileResponse MapToResponse(UpdateUserProfileCommandResponse commandResponse);
////}