//using Contracts.User.Requests;
//using UserService.Application.Commands;
//using UserService.Application.Queries;

//namespace UserService.Extensions;

///// <summary>
///// Extensions to map Contract requests to internal Commands/Queries
///// </summary>
//public static class ContractMappingExtensions
//{
//    // Authentication Command Mappings
//    public static LoginUserCommand ToCommand(this LoginRequest request) =>
//        LoginUserCommand.FromRequest(request);
        
//    public static RegisterUserCommand ToCommand(this RegisterUserRequest request) =>
//        new(request.FirstName, request.LastName, request.UserName, request.Email, request.Password);
        
//    // Profile Command Mappings  
//    public static ChangePasswordCommand ToCommand(this ChangePasswordRequest request) =>
//        new(request.CurrentPassword, request.NewPassword);
        
//    public static UpdateUserProfileCommand ToCommand(this UpdateUserProfileRequest request) =>
//        new(request.FirstName, request.LastName, request.UserName, request.Bio, request.Location, request.Skills);
        
//    // Query Mappings
//    public static GetUserProfileQuery ToQuery(this GetUserProfileRequest request) =>
//        new(request.UserId);
        
//    public static CheckEmailAvailabilityQuery ToQuery(this CheckEmailAvailabilityRequest request) =>
//        new(request.Email);
        
//    public static SearchUsersQuery ToQuery(this SearchUsersRequest request) =>
//        new(request.SearchTerm, request.Skills, request.Location, request.PageNumber, request.PageSize);
        
//    public static GetUserStatisticsQuery ToQuery(this GetUserStatisticsRequest request) =>
//        new(request.UserId, request.FromDate, request.ToDate);
//}
