using AutoMapper;
using Contracts.User.Requests;
using Contracts.User.Responses;
using UserService.Application.Commands;

namespace UserService.Application.Mappers;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        // Request to Command mappings
        CreateMap<RegisterUserRequest, RegisterUserCommand>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => Guid.NewGuid()))
            .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<LoginRequest, LoginUserCommand>()
            .ForMember(dest => dest.DeviceId, opt => opt.Ignore()); // Set from HTTP context
            //.ForMember(dest => dest.UserAgent, opt => opt.Ignore());

        CreateMap<UpdateUserProfileRequest, UpdateUserProfileCommand>()
            .ForMember(dest => dest, opt => opt.MapFrom(src =>
                GetUpdatedFields(src)));

        // Command Response to Contract Response mappings
        CreateMap<RegisterUserCommand, RegisterUserResponse>()
            .ForMember(dest => dest.ApiVersion, opt => opt.MapFrom(src => "v1"));

        CreateMap<LoginUserCommand, LoginResponse>()
            .ForMember(dest => dest.TokenType, opt => opt.MapFrom(src => "Bearer"));

        CreateMap<UserInfo, UserProfileResponse>()
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src =>
                src.Roles.Select(ur => ur).ToList()));
    }

    private static Dictionary<string, string> GetUpdatedFields(UpdateUserProfileRequest request)
    {
        var fields = new Dictionary<string, string>();

        if (request.FirstName != null) fields["FirstName"] = request.FirstName;
        if (request.LastName != null) fields["LastName"] = request.LastName;
        if (request.PhoneNumber != null) fields["PhoneNumber"] = request.PhoneNumber;
        if (request.Bio != null) fields["Bio"] = request.Bio;
        if (request.Location != null) fields["Location"] = request.Location;
        if (request.TimeZone != null) fields["TimeZone"] = request.TimeZone;

        return fields;
    }
}