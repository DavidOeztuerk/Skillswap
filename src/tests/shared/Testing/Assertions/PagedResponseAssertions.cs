using FluentAssertions;
using FluentAssertions.Execution;
using FluentAssertions.Primitives;
using CQRS.Models;

namespace Testing.Assertions;

public class PagedResponseAssertions<T> : ReferenceTypeAssertions<PagedResponse<T>, PagedResponseAssertions<T>>
{
    public PagedResponseAssertions(PagedResponse<T> instance) : base(instance)
    {
    }

    protected override string Identifier => "PagedResponse";

    public AndConstraint<PagedResponseAssertions<T>> HaveCount(int expectedCount, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Data?.Count == expectedCount)
            .FailWith("Expected {context:PagedResponse} to have {0} items{reason}, but found {1}.", expectedCount, Subject?.Data?.Count ?? 0);

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> HaveTotalCount(int expectedTotal, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.TotalRecords == expectedTotal)
            .FailWith("Expected {context:PagedResponse} to have total count of {0}{reason}, but found {1}.", expectedTotal, Subject?.TotalRecords ?? 0);

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> BeOnPage(int expectedPage, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.PageNumber == expectedPage)
            .FailWith("Expected {context:PagedResponse} to be on page {0}{reason}, but was on page {1}.", expectedPage, Subject?.PageNumber ?? 0);

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> HavePageSize(int expectedSize, string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.PageSize == expectedSize)
            .FailWith("Expected {context:PagedResponse} to have page size of {0}{reason}, but found {1}.", expectedSize, Subject?.PageSize ?? 0);

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> HaveNextPage(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.HasNextPage == true)
            .FailWith("Expected {context:PagedResponse} to have a next page{reason}, but it did not.");

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> NotHaveNextPage(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.HasNextPage == false)
            .FailWith("Expected {context:PagedResponse} not to have a next page{reason}, but it did.");

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> HavePreviousPage(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.HasPreviousPage == true)
            .FailWith("Expected {context:PagedResponse} to have a previous page{reason}, but it did not.");

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> NotHavePreviousPage(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.HasPreviousPage == false)
            .FailWith("Expected {context:PagedResponse} not to have a previous page{reason}, but it did.");

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> BeEmpty(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Data == null || Subject.Data.Count == 0)
            .FailWith("Expected {context:PagedResponse} to be empty{reason}, but it contained {0} items.", Subject?.Data?.Count ?? 0);

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }

    public AndConstraint<PagedResponseAssertions<T>> NotBeEmpty(string because = "", params object[] becauseArgs)
    {
        Execute.Assertion
            .BecauseOf(because, becauseArgs)
            .ForCondition(Subject?.Data != null && Subject.Data.Count > 0)
            .FailWith("Expected {context:PagedResponse} not to be empty{reason}, but it was.");

        return new AndConstraint<PagedResponseAssertions<T>>(this);
    }
}

public static class PagedResponseAssertionsExtensions
{
    public static PagedResponseAssertions<T> Should<T>(this PagedResponse<T> instance)
    {
        return new PagedResponseAssertions<T>(instance);
    }
}