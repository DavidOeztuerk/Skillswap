using Microsoft.Extensions.Configuration;

namespace Core.Common.Exceptions;

/// <summary>
/// Service for providing user-friendly error messages and help information
/// </summary>
public class ErrorMessageService : IErrorMessageService
{
    private readonly Dictionary<string, ErrorInfo> _errorMappings;
    private readonly string _baseHelpUrl;

    public ErrorMessageService(IConfiguration? configuration = null)
    {
        _baseHelpUrl = configuration?["ErrorHandling:HelpUrl"] ?? "https://docs.skillswap.com/errors/";
        _errorMappings = InitializeErrorMappings();
    }

    public string GetUserMessage(string errorCode, string? defaultMessage = null)
    {
        if (_errorMappings.TryGetValue(errorCode, out var errorInfo))
        {
            return errorInfo.UserMessage;
        }

        return defaultMessage ?? "An unexpected error occurred. Please try again later.";
    }

    public string? GetHelpUrl(string errorCode)
    {
        if (_errorMappings.TryGetValue(errorCode, out var errorInfo) && !string.IsNullOrEmpty(errorInfo.HelpPath))
        {
            return $"{_baseHelpUrl}{errorInfo.HelpPath}";
        }

        return null;
    }

    public string[]? GetSuggestedActions(string errorCode)
    {
        if (_errorMappings.TryGetValue(errorCode, out var errorInfo))
        {
            return errorInfo.SuggestedActions;
        }

        return null;
    }

    public bool IsUserFacingError(string errorCode)
    {
        if (_errorMappings.TryGetValue(errorCode, out var errorInfo))
        {
            return errorInfo.IsUserFacing;
        }

        // Default to not showing technical errors to users
        return false;
    }

    private Dictionary<string, ErrorInfo> InitializeErrorMappings()
    {
        return new Dictionary<string, ErrorInfo>
        {
            // Domain Errors
            [ErrorCodes.BusinessRuleViolation] = new ErrorInfo
            {
                UserMessage = "This action violates business rules. Please check your input and try again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Review the requirements", "Contact support if the issue persists" }
            },
            
            [ErrorCodes.ResourceNotFound] = new ErrorInfo
            {
                UserMessage = "The requested item could not be found. It may have been deleted or you may not have access to it.",
                IsUserFacing = true,
                HelpPath = "resource-not-found",
                SuggestedActions = new[] { "Check the URL or ID", "Refresh the page", "Contact the owner of the resource" }
            },
            
            [ErrorCodes.ResourceAlreadyExists] = new ErrorInfo
            {
                UserMessage = "An item with the same identifier already exists. Please use a different name or identifier.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Choose a different name", "Update the existing item instead" }
            },
            
            // Authentication & Authorization
            [ErrorCodes.Unauthorized] = new ErrorInfo
            {
                UserMessage = "You need to sign in to access this resource.",
                IsUserFacing = true,
                HelpPath = "authentication",
                SuggestedActions = new[] { "Sign in to your account", "Check if your session has expired" }
            },
            
            [ErrorCodes.InsufficientPermissions] = new ErrorInfo
            {
                UserMessage = "You don't have permission to perform this action.",
                IsUserFacing = true,
                HelpPath = "permissions",
                SuggestedActions = new[] { "Contact your administrator", "Request the necessary permissions" }
            },
            
            [ErrorCodes.TokenExpired] = new ErrorInfo
            {
                UserMessage = "Your session has expired. Please sign in again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Sign in again", "Remember to stay active to avoid session timeout" }
            },
            
            [ErrorCodes.InvalidCredentials] = new ErrorInfo
            {
                UserMessage = "Invalid email or password. Please check your credentials and try again.",
                IsUserFacing = true,
                HelpPath = "login-issues",
                SuggestedActions = new[] { "Check your email and password", "Use the 'Forgot Password' option if needed", "Make sure Caps Lock is off" }
            },
            
            [ErrorCodes.AccountNotVerified] = new ErrorInfo
            {
                UserMessage = "Please verify your email address to continue. Check your inbox for the verification link.",
                IsUserFacing = true,
                HelpPath = "email-verification",
                SuggestedActions = new[] { "Check your email inbox", "Check your spam folder", "Click 'Resend Verification' if needed" }
            },
            
            [ErrorCodes.TwoFactorRequired] = new ErrorInfo
            {
                UserMessage = "Two-factor authentication is required for this action.",
                IsUserFacing = true,
                HelpPath = "two-factor-auth",
                SuggestedActions = new[] { "Enter your 2FA code", "Set up 2FA if you haven't already" }
            },
            
            // Validation Errors
            [ErrorCodes.ValidationFailed] = new ErrorInfo
            {
                UserMessage = "Please check your input and correct any errors.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Review all required fields", "Check for formatting errors" }
            },
            
            [ErrorCodes.RequiredFieldMissing] = new ErrorInfo
            {
                UserMessage = "Please fill in all required fields.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Look for fields marked with *", "Complete all mandatory information" }
            },
            
            [ErrorCodes.InvalidEmail] = new ErrorInfo
            {
                UserMessage = "Please enter a valid email address.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Check the email format (e.g., user@example.com)" }
            },
            
            [ErrorCodes.InvalidPhoneNumber] = new ErrorInfo
            {
                UserMessage = "Please enter a valid phone number.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Include country code if required", "Remove any special characters" }
            },
            
            // External Service Errors
            [ErrorCodes.ServiceUnavailable] = new ErrorInfo
            {
                UserMessage = "The service is temporarily unavailable. Please try again in a few moments.",
                IsUserFacing = true,
                HelpPath = "service-status",
                SuggestedActions = new[] { "Wait a few minutes and try again", "Check our status page" }
            },
            
            [ErrorCodes.ServiceTimeout] = new ErrorInfo
            {
                UserMessage = "The request took too long to complete. Please try again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Check your internet connection", "Try a simpler request", "Retry the operation" }
            },
            
            [ErrorCodes.RateLimitExceeded] = new ErrorInfo
            {
                UserMessage = "You've made too many requests. Please wait a moment before trying again.",
                IsUserFacing = true,
                HelpPath = "rate-limits",
                SuggestedActions = new[] { "Wait 60 seconds before retrying", "Reduce the frequency of requests" }
            },
            
            [ErrorCodes.PaymentFailed] = new ErrorInfo
            {
                UserMessage = "Payment processing failed. Please check your payment information and try again.",
                IsUserFacing = true,
                HelpPath = "payment-issues",
                SuggestedActions = new[] { "Verify your payment method", "Check with your bank", "Try a different payment method" }
            },
            
            // File & Storage Errors
            [ErrorCodes.FileTooLarge] = new ErrorInfo
            {
                UserMessage = "The file is too large. Please choose a smaller file.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Compress the file", "Choose a file under the size limit" }
            },
            
            [ErrorCodes.InvalidFileType] = new ErrorInfo
            {
                UserMessage = "This file type is not supported. Please choose a different file.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Check supported file types", "Convert your file to a supported format" }
            },
            
            [ErrorCodes.StorageQuotaExceeded] = new ErrorInfo
            {
                UserMessage = "You've reached your storage limit. Please delete some files or upgrade your plan.",
                IsUserFacing = true,
                HelpPath = "storage-limits",
                SuggestedActions = new[] { "Delete unused files", "Upgrade your storage plan" }
            },
            
            // Business Logic Errors
            [ErrorCodes.InsufficientBalance] = new ErrorInfo
            {
                UserMessage = "You don't have enough credits for this action.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Purchase more credits", "Check your current balance" }
            },
            
            [ErrorCodes.SubscriptionExpired] = new ErrorInfo
            {
                UserMessage = "Your subscription has expired. Please renew to continue.",
                IsUserFacing = true,
                HelpPath = "subscription",
                SuggestedActions = new[] { "Renew your subscription", "Choose a different plan" }
            },
            
            [ErrorCodes.MaxAttemptsExceeded] = new ErrorInfo
            {
                UserMessage = "Maximum attempts exceeded. Please wait before trying again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Wait 30 minutes before retrying", "Contact support if you need immediate assistance" }
            },
            
            // Database Errors (usually not user-facing)
            [ErrorCodes.DatabaseError] = new ErrorInfo
            {
                UserMessage = "A technical error occurred. Our team has been notified.",
                IsUserFacing = false
            },
            
            [ErrorCodes.DeadlockDetected] = new ErrorInfo
            {
                UserMessage = "The operation could not be completed due to a conflict. Please try again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Retry the operation", "Wait a moment if multiple users are updating the same data" }
            },
            
            // System Errors (not user-facing)
            [ErrorCodes.InternalError] = new ErrorInfo
            {
                UserMessage = "An unexpected error occurred. Our team has been notified.",
                IsUserFacing = false
            },
            
            // Network Errors
            [ErrorCodes.ConnectionTimeout] = new ErrorInfo
            {
                UserMessage = "Connection timed out. Please check your internet connection and try again.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Check your internet connection", "Try again in a few moments" }
            },
            
            [ErrorCodes.SslError] = new ErrorInfo
            {
                UserMessage = "Secure connection failed. Please ensure you're using a modern browser.",
                IsUserFacing = true,
                SuggestedActions = new[] { "Update your browser", "Check your system date and time" }
            }
        };
    }

    private class ErrorInfo
    {
        public string UserMessage { get; set; } = string.Empty;
        public bool IsUserFacing { get; set; } = true;
        public string? HelpPath { get; set; }
        public string[]? SuggestedActions { get; set; }
    }
}