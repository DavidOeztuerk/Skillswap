using CQRS.Models;
using FluentAssertions;
using Xunit;

namespace Shared.Tests.CQRS;

public class PagedResponseTests
{
    [Fact]
    public void Create_WithValidData_ShouldCalculatePaginationCorrectly()
    {
        // Arrange
        var data = new List<string> { "item1", "item2", "item3" };
        var pageNumber = 2;
        var pageSize = 3;
        var totalRecords = 10;
        var message = "Data retrieved successfully";

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords, message);

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().BeEquivalentTo(data);
        response.Message.Should().Be(message);
        response.PageNumber.Should().Be(pageNumber);
        response.PageSize.Should().Be(pageSize);
        response.TotalRecords.Should().Be(totalRecords);
        response.TotalPages.Should().Be(4); // Math.Ceiling(10/3) = 4
        response.HasNextPage.Should().BeTrue(); // page 2 < 4
        response.HasPreviousPage.Should().BeTrue(); // page 2 > 1
    }

    [Fact]
    public void Create_FirstPage_ShouldNotHavePreviousPage()
    {
        // Arrange
        var data = new List<string> { "item1", "item2" };
        var pageNumber = 1;
        var pageSize = 2;
        var totalRecords = 10;

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.PageNumber.Should().Be(1);
        response.TotalPages.Should().Be(5); // Math.Ceiling(10/2) = 5
        response.HasNextPage.Should().BeTrue();
        response.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void Create_LastPage_ShouldNotHaveNextPage()
    {
        // Arrange
        var data = new List<string> { "item1" };
        var pageNumber = 5;
        var pageSize = 1;
        var totalRecords = 5;

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.PageNumber.Should().Be(5);
        response.TotalPages.Should().Be(5); // Math.Ceiling(5/1) = 5
        response.HasNextPage.Should().BeFalse();
        response.HasPreviousPage.Should().BeTrue();
    }

    [Fact]
    public void Create_WithEmptyData_ShouldStillCalculatePaginationCorrectly()
    {
        // Arrange
        var data = new List<string>();
        var pageNumber = 1;
        var pageSize = 10;
        var totalRecords = 0;

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().BeEmpty();
        response.PageNumber.Should().Be(1);
        response.PageSize.Should().Be(10);
        response.TotalRecords.Should().Be(0);
        response.TotalPages.Should().Be(0); // Math.Ceiling(0/10) = 0
        response.HasNextPage.Should().BeFalse();
        response.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void Create_SinglePage_ShouldHaveNoPreviousOrNextPage()
    {
        // Arrange
        var data = new List<string> { "item1", "item2", "item3" };
        var pageNumber = 1;
        var pageSize = 10;
        var totalRecords = 3;

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.Data.Should().HaveCount(3);
        response.TotalRecords.Should().Be(3);
        response.PageNumber.Should().Be(1);
        response.TotalPages.Should().Be(1); // Math.Ceiling(3/10) = 1
        response.HasNextPage.Should().BeFalse();
        response.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void Create_ShouldCalculateTotalPagesCorrectly()
    {
        // Test exact division
        var response1 = PagedResponse<string>.Create(new List<string>(), 1, 5, 10);
        response1.TotalPages.Should().Be(2); // Math.Ceiling(10/5) = 2

        // Test with remainder
        var response2 = PagedResponse<string>.Create(new List<string>(), 1, 5, 11);
        response2.TotalPages.Should().Be(3); // Math.Ceiling(11/5) = 3

        // Test single item
        var response3 = PagedResponse<string>.Create(new List<string>(), 1, 5, 1);
        response3.TotalPages.Should().Be(1); // Math.Ceiling(1/5) = 1
    }

    [Fact]
    public void Create_WithExactlyOnePageOfData_ShouldCalculateCorrectly()
    {
        // Arrange
        var data = new List<int> { 1, 2, 3, 4, 5 };
        var pageNumber = 1;
        var pageSize = 5;
        var totalRecords = 5;

        // Act
        var response = PagedResponse<int>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.TotalPages.Should().Be(1); // Math.Ceiling(5/5) = 1
        response.HasNextPage.Should().BeFalse();
        response.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void Create_InheritsApiResponseProperties()
    {
        // Arrange
        var data = new List<string> { "Test" };

        // Act
        var response = PagedResponse<string>.Create(data, 1, 10, 1);

        // Assert
        response.Should().BeAssignableTo<ApiResponse<List<string>>>();
        response.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        response.TraceId.Should().NotBeNullOrEmpty();
        response.Errors.Should().BeNull();
    }

    [Fact]
    public void Create_WithLargeDataset_ShouldCalculatePaginationCorrectly()
    {
        // Arrange
        var data = Enumerable.Range(1, 20).Select(i => $"Item{i}").ToList();
        var pageNumber = 5;
        var pageSize = 20;
        var totalRecords = 1000;

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.Data.Should().HaveCount(20);
        response.PageNumber.Should().Be(5);
        response.PageSize.Should().Be(20);
        response.TotalRecords.Should().Be(1000);
        response.TotalPages.Should().Be(50); // Math.Ceiling(1000/20) = 50
        response.HasNextPage.Should().BeTrue(); // 5 < 50
        response.HasPreviousPage.Should().BeTrue(); // 5 > 1
    }

    [Fact]
    public void Create_WithPageNumberBeyondTotalPages_ShouldStillSetHasNextPageCorrectly()
    {
        // Arrange
        var data = new List<string>();
        var pageNumber = 10; // Beyond actual pages
        var pageSize = 5;
        var totalRecords = 15; // Only 3 pages total

        // Act
        var response = PagedResponse<string>.Create(data, pageNumber, pageSize, totalRecords);

        // Assert
        response.PageNumber.Should().Be(10);
        response.TotalPages.Should().Be(3); // Math.Ceiling(15/5) = 3
        response.HasNextPage.Should().BeFalse(); // 10 > 3
        response.HasPreviousPage.Should().BeTrue(); // 10 > 1
    }
}