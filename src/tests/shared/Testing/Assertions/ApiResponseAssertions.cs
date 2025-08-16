using FluentAssertions;
using FluentAssertions.Execution;
using FluentAssertions.Primitives;
using CQRS.Models;

namespace Testing.Assertions;

public class ApiResponseAssertions<T> : ReferenceTypeAssertions<ApiResponse<T>, ApiResponseAssertions<T>>
{
    public ApiResponseAssertions(ApiResponse<T> instance) : base(instance)
    {
    }

    protected override string Identifier => "ApiResponse";

    public AndConstraint<ApiResponseAssertions<T>> BeSuccessful(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Success == true)
            .FailWith("Expected {context:ApiResponse} to be successful{reason}, but it was not.");

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> BeFailure(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Success == false)
            .FailWith("Expected {context:ApiResponse} to be a failure{reason}, but it was successful.");

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> HaveData(T expected, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject != null)
            .FailWith("Expected {context:ApiResponse} to have data{reason}, but it was null.")
            .Then
            .ForCondition(Subject!.Data != null)
            .FailWith("Expected {context:ApiResponse} to have data{reason}, but Data was null.")
            .Then
            .ForCondition(Subject.Data!.Equals(expected))
            .FailWith("Expected {context:ApiResponse} to have data {0}{reason}, but found {1}.", expected, Subject.Data);

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> HaveMessage(string expected, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Message == expected)
            .FailWith("Expected {context:ApiResponse} to have message {0}{reason}, but found {1}.", expected, Subject?.Message);

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> HaveError(string expectedError, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Errors?.Contains(expectedError) == true)
            .FailWith("Expected {context:ApiResponse} to have error {0}{reason}, but it was not found.", expectedError);

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> HaveNoErrors(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Errors == null || Subject.Errors.Count == 0)
            .FailWith("Expected {context:ApiResponse} to have no errors{reason}, but found {0} errors.", Subject?.Errors?.Count ?? 0);

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }

    public AndConstraint<ApiResponseAssertions<T>> HaveErrorCount(int expectedCount, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Errors?.Count == expectedCount)
            .FailWith("Expected {context:ApiResponse} to have {0} errors{reason}, but found {1}.", expectedCount, Subject?.Errors?.Count ?? 0);

        return new AndConstraint<ApiResponseAssertions<T>>(this);
    }
}

public static class ApiResponseAssertionsExtensions
{
    public static ApiResponseAssertions<T> Should<T>(this ApiResponse<T> instance)
    {
        return new ApiResponseAssertions<T>(instance);
    }
}