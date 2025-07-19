
//using CQRS.Interfaces;
//using FluentValidation;
//using UserService.Application.Commands;

//namespace UserService.Application.Queries;

//public record GetUserAvailabilityQuery(
//    string UserId)
//    : IQuery<UserAvailabilityResponse>, ICacheableQuery
//{
//    public string CacheKey => $"user-availability:{UserId}";
//    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
//}

//public record UserAvailabilityResponse(
//    string UserId,
//    List<WeeklyAvailability> WeeklySchedule,
//    string? TimeZone,
//    List<DateRange>? BlockedDates,
//    DateTime? LastUpdated);

//public class GetUserAvailabilityQueryValidator : AbstractValidator<GetUserAvailabilityQuery>
//{
//    public GetUserAvailabilityQueryValidator()
//    {
//        RuleFor(x => x.UserId)
//            .NotEmpty().WithMessage("User ID is required");
//    }
//}
