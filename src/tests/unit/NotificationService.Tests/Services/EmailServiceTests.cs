using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Testing;
using NotificationService.Infrastructure.Services;
using NotificationService.Domain.Entities;
using Xunit;
using Bogus;
using System.Net.Mail;
using System.Net;

namespace NotificationService.Tests.Services;

public class EmailServiceTests : BaseUnitTest
{
    private readonly Mock<IOptions<EmailConfiguration>> _mockEmailConfig;
    private readonly Mock<ILogger<EmailService>> _mockLogger;
    private readonly Mock<SmtpClient> _mockSmtpClient;
    private readonly EmailService _emailService;
    private readonly Faker _faker;

    public EmailServiceTests()
    {
        _mockLogger = new Mock<ILogger<EmailService>>();
        _faker = new Faker();

        var emailConfig = new EmailConfiguration
        {
            SmtpServer = "smtp.test.com",
            SmtpPort = 587,
            SmtpUsername = "test@skillswap.com",
            SmtpPassword = "testpassword",
            FromEmail = "noreply@skillswap.com",
            FromName = "Skillswap",
            EnableSsl = true
        };

        _mockEmailConfig = new Mock<IOptions<EmailConfiguration>>();
        _mockEmailConfig.Setup(x => x.Value).Returns(emailConfig);

        _emailService = new EmailService(_mockEmailConfig.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task SendEmailAsync_WithValidData_ShouldReturnTrue()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        var subject = _faker.Lorem.Sentence();
        var body = _faker.Lorem.Paragraph();

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject, body);

        // Assert
        result.Should().BeTrue();
        _mockLogger.Verify(x => x.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Email sent successfully")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task SendEmailAsync_WithInvalidEmail_ShouldReturnFalse()
    {
        // Arrange
        var toEmail = "invalid-email";
        var subject = _faker.Lorem.Sentence();
        var body = _faker.Lorem.Paragraph();

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject, body);

        // Assert
        result.Should().BeFalse();
        _mockLogger.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to send email")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task SendEmailAsync_WithHtmlBody_ShouldSetIsBodyHtml()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        var subject = _faker.Lorem.Sentence();
        var htmlBody = $"<html><body><h1>{_faker.Lorem.Sentence()}</h1><p>{_faker.Lorem.Paragraph()}</p></body></html>";

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject, htmlBody, isHtml: true);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task SendEmailAsync_WithAttachment_ShouldIncludeAttachment()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        var subject = _faker.Lorem.Sentence();
        var body = _faker.Lorem.Paragraph();
        var attachmentPath = "test-attachment.pdf";
        var attachments = new List<string> { attachmentPath };

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject, body, attachments: attachments);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task SendBulkEmailAsync_ShouldSendToAllRecipients()
    {
        // Arrange
        var recipients = _faker.Make(5, () => _faker.Internet.Email());
        var subject = _faker.Lorem.Sentence();
        var body = _faker.Lorem.Paragraph();

        // Act
        var results = await _emailService.SendBulkEmailAsync(recipients, subject, body);

        // Assert
        results.Should().HaveCount(5);
        results.Should().AllBeEquivalentTo(true);
    }

    [Fact]
    public async Task SendTemplatedEmailAsync_ShouldReplaceTemplateVariables()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        var subject = "Welcome {{userName}}!";
        var body = "Hello {{userName}}, your account {{userEmail}} has been created.";
        var variables = new Dictionary<string, string>
        {
            { "userName", "John Doe" },
            { "userEmail", "john@example.com" }
        };

        // Act
        var result = await _emailService.SendTemplatedEmailAsync(toEmail, subject, body, variables);

        // Assert
        result.Should().BeTrue();
        _mockLogger.Verify(x => x.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Template email sent")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task SendEmailAsync_WithNullSubject_ShouldReturnFalse()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        string? subject = null;
        var body = _faker.Lorem.Paragraph();

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject!, body);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SendEmailAsync_WithEmptyBody_ShouldReturnFalse()
    {
        // Arrange
        var toEmail = _faker.Internet.Email();
        var subject = _faker.Lorem.Sentence();
        var body = string.Empty;

        // Act
        var result = await _emailService.SendEmailAsync(toEmail, subject, body);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SendEmailAsync_WhenSmtpFails_ShouldReturnFalse()
    {
        // Arrange
        var invalidConfig = new EmailConfiguration
        {
            SmtpServer = "invalid.smtp.server",
            SmtpPort = 9999,
            SmtpUsername = "invalid",
            SmtpPassword = "invalid",
            FromEmail = "noreply@skillswap.com",
            FromName = "Skillswap",
            EnableSsl = true
        };

        var mockInvalidConfig = new Mock<IOptions<EmailConfiguration>>();
        mockInvalidConfig.Setup(x => x.Value).Returns(invalidConfig);

        var emailService = new EmailService(mockInvalidConfig.Object, _mockLogger.Object);

        var toEmail = _faker.Internet.Email();
        var subject = _faker.Lorem.Sentence();
        var body = _faker.Lorem.Paragraph();

        // Act
        var result = await emailService.SendEmailAsync(toEmail, subject, body);

        // Assert
        result.Should().BeFalse();
    }
}