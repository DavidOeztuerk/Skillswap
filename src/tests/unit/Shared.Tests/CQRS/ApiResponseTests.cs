using CQRS.Models;
using FluentAssertions;
using Xunit;

namespace Shared.Tests.CQRS;

public class ApiResponseTests
{
    [Fact]
    public void SuccessResult_ShouldCreateSuccessfulResponse()
    {
        // Arrange
        var data = "test data";
        var message = "Operation successful";

        // Act
        var response = ApiResponse<string>.SuccessResult(data, message);

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().Be(data);
        response.Message.Should().Be(message);
        response.Errors.Should().BeNullOrEmpty();
        response.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        response.TraceId.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void ErrorResult_WithSingleError_ShouldCreateFailureResponse()
    {
        // Arrange
        var errorMessage = "Operation failed";
        var traceId = "test-trace-id";

        // Act
        var response = ApiResponse<string>.ErrorResult(errorMessage, traceId);

        // Assert
        response.Success.Should().BeFalse();
        response.Data.Should().BeNull();
        response.Errors.Should().NotBeNull();
        response.Errors.Should().ContainSingle();
        response.Errors![0].Should().Be(errorMessage);
        response.TraceId.Should().Be(traceId);
    }

    [Fact]
    public void ErrorResult_WithMultipleErrors_ShouldCreateFailureResponseWithAllErrors()
    {
        // Arrange
        var errors = new List<string> { "Error 1", "Error 2", "Error 3" };
        var traceId = "test-trace-id";

        // Act
        var response = ApiResponse<string>.ErrorResult(errors, traceId);

        // Assert
        response.Success.Should().BeFalse();
        response.Data.Should().BeNull();
        response.Errors.Should().NotBeNull();
        response.Errors.Should().HaveCount(3);
        response.Errors.Should().BeEquivalentTo(errors);
        response.TraceId.Should().Be(traceId);
    }

    [Fact]
    public void SuccessResult_WithoutMessage_ShouldHaveNullMessage()
    {
        // Arrange
        var data = "test data";

        // Act
        var response = ApiResponse<string>.SuccessResult(data);

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().Be(data);
        response.Message.Should().BeNull();
        response.Errors.Should().BeNullOrEmpty();
    }

    [Fact]
    public void SuccessResult_WithNullData_ShouldBeSuccessful()
    {
        // Act
        var response = ApiResponse<string?>.SuccessResult(null, "Completed");

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().BeNull();
        response.Message.Should().Be("Completed");
    }

    [Fact]
    public void ErrorResult_WithNullTraceId_ShouldGenerateNewTraceId()
    {
        // Arrange
        var errorMessage = "Test error";

        // Act
        var response = ApiResponse<string>.ErrorResult(errorMessage);

        // Assert
        response.Success.Should().BeFalse();
        response.TraceId.Should().NotBeNullOrEmpty();
        response.Errors.Should().ContainSingle(e => e == errorMessage);
    }

    [Fact]
    public void DefaultConstructor_ShouldInitializeTimestampAndTraceId()
    {
        // Act
        var response = new ApiResponse<string>();

        // Assert
        response.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        response.TraceId.Should().NotBeNullOrEmpty();
        response.Success.Should().BeFalse(); // default value
        response.Data.Should().BeNull();
        response.Message.Should().BeNull();
        response.Errors.Should().BeNull();
    }
}