using Contracts.User.Requests;
using Contracts.User.Responses;

namespace Contracts.Mappers;

/// <summary>
/// Mapper for User service contracts to CQRS commands/queries
/// This will be implemented in the UserService to avoid circular dependencies
/// </summary>
public interface IUserContractMapper
{
    // Register User Mapping
    RegisterUserCommand MapToCommand(RegisterUserRequest request, string? userId = null);
    RegisterUserResponse MapToResponse(RegisterUserCommandResponse commandResponse);

    // Login User Mapping  
    LoginUserCommand MapToCommand(LoginUserRequest request, string? userId = null);
    LoginUserResponse MapToResponse(LoginUserCommandResponse commandResponse);

    // Get User Profile Mapping
    GetUserProfileQuery MapToQuery(GetUserProfileRequest request, string? userId = null);
    UserProfileResponse MapToResponse(GetUserProfileQueryResponse queryResponse);

    // Search Users Mapping
    SearchUsersQuery MapToQuery(SearchUsersRequest request, string? userId = null);
    SearchUsersResponse MapToResponse(SearchUsersQueryResponse queryResponse);
}

// Placeholder types - these will reference actual CQRS types in UserService
public interface RegisterUserCommand { }
public interface RegisterUserCommandResponse { }
public interface LoginUserCommand { }
public interface LoginUserCommandResponse { }
public interface GetUserProfileQuery { }
public interface GetUserProfileQueryResponse { }
public interface SearchUsersQuery { }
public interface SearchUsersQueryResponse { }