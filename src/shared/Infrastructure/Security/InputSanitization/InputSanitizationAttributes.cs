// using Microsoft.AspNetCore.Mvc;
// using Microsoft.AspNetCore.Mvc.Filters;
// using Microsoft.Extensions.DependencyInjection;
// using System.ComponentModel.DataAnnotations;

// namespace Infrastructure.Security.InputSanitization;

// /// <summary>
// /// Attribute for automatic input sanitization on action parameters
// /// </summary>
// [AttributeUsage(AttributeTargets.Parameter | AttributeTargets.Property)]
// public class SanitizeInputAttribute : Attribute, IParameterModelConvention, IPropertyModelConvention
// {
//     /// <summary>
//     /// HTML sanitization level
//     /// </summary>
//     public HtmlSanitizationLevel HtmlLevel { get; set; } = HtmlSanitizationLevel.Strict;

//     /// <summary>
//     /// Maximum allowed length
//     /// </summary>
//     public int MaxLength { get; set; } = 1000;

//     /// <summary>
//     /// Allow HTML content
//     /// </summary>
//     public bool AllowHtml { get; set; } = false;

//     /// <summary>
//     /// Remove line breaks
//     /// </summary>
//     public bool RemoveLineBreaks { get; set; } = false;

//     /// <summary>
//     /// Normalize whitespace
//     /// </summary>
//     public bool NormalizeWhitespace { get; set; } = true;

//     /// <summary>
//     /// Custom sanitization pattern name
//     /// </summary>
//     public string? SanitizationPattern { get; set; }

//     public void Apply(Microsoft.AspNetCore.Mvc.ApplicationModels.ParameterModel parameter)
//     {
//         if (parameter.ParameterType == typeof(string))
//         {
//             parameter.Attributes.Add(new SanitizeInputActionFilter(this));
//         }
//     }

//     public void Apply(Microsoft.AspNetCore.Mvc.ApplicationModels.PropertyModel property)
//     {
//         if (property.PropertyInfo?.PropertyType == typeof(string))
//         {
//             property.Attributes.Add(new SanitizeInputActionFilter(this));
//         }
//     }
// }

// /// <summary>
// /// Action filter for input sanitization
// /// </summary>
// public class SanitizeInputActionFilter : ActionFilterAttribute
// {
//     private readonly SanitizeInputAttribute _attribute;

//     public SanitizeInputActionFilter(SanitizeInputAttribute attribute)
//     {
//         _attribute = attribute;
//     }

//     public override void OnActionExecuting(ActionExecutingContext context)
//     {
//         var sanitizer = context.HttpContext.RequestServices.GetRequiredService<IInputSanitizer>();

//         foreach (var parameter in context.ActionArguments.ToList())
//         {
//             if (parameter.Value is string stringValue)
//             {
//                 var options = new TextSanitizationOptions
//                 {
//                     AllowHtml = _attribute.AllowHtml,
//                     HtmlLevel = _attribute.HtmlLevel,
//                     MaxLength = _attribute.MaxLength,
//                     RemoveLineBreaks = _attribute.RemoveLineBreaks,
//                     NormalizeWhitespace = _attribute.NormalizeWhitespace
//                 };

//                 var sanitized = sanitizer.SanitizeText(stringValue, options);
//                 context.ActionArguments[parameter.Key] = sanitized;
//             }
//             else if (parameter.Value != null)
//             {
//                 // Sanitize object properties
//                 var sanitized = sanitizer.SanitizeObject(parameter.Value);
//                 context.ActionArguments[parameter.Key] = sanitized;
//             }
//         }

//         base.OnActionExecuting(context);
//     }
// }

// /// <summary>
// /// Validation attribute for detecting injection attempts
// /// </summary>
// [AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
// public class ValidateNoInjectionAttribute : ValidationAttribute
// {
//     /// <summary>
//     /// Block on injection detection
//     /// </summary>
//     public bool BlockOnDetection { get; set; } = true;

//     /// <summary>
//     /// Minimum risk level to trigger validation failure
//     /// </summary>
//     public RiskLevel MinimumRiskLevel { get; set; } = RiskLevel.Medium;

//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string stringValue || string.IsNullOrEmpty(stringValue))
//         {
//             return ValidationResult.Success;
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var injectionDetector = serviceProvider?.GetService<IInjectionDetector>();

//         if (injectionDetector == null)
//         {
//             // If injection detector is not available, fall back to basic validation
//             return ValidationResult.Success;
//         }

//         var result = injectionDetector.DetectInjection(stringValue);

//         if (result.InjectionDetected && result.RiskLevel >= MinimumRiskLevel)
//         {
//             if (BlockOnDetection)
//             {
//                 return new ValidationResult(
//                     $"Potentially malicious input detected: {result.InjectionType} (Risk: {result.RiskLevel})",
//                     validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//             }
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Validation attribute for email addresses with sanitization
// /// </summary>
// public class ValidateEmailAttribute : ValidationAttribute
// {
//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string email || string.IsNullOrEmpty(email))
//         {
//             return new ValidationResult("Email address is required");
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var sanitizer = serviceProvider?.GetRequiredService<IInputSanitizer>();

//         if (sanitizer == null)
//         {
//             return new ValidationResult("Email validation service not available");
//         }

//         var result = sanitizer.SanitizeEmail(email);

//         if (!result.IsValid)
//         {
//             return new ValidationResult(
//                 string.Join(", ", result.Errors),
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Validation attribute for phone numbers with sanitization
// /// </summary>
// public class ValidatePhoneNumberAttribute : ValidationAttribute
// {
//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string phone || string.IsNullOrEmpty(phone))
//         {
//             return new ValidationResult("Phone number is required");
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var sanitizer = serviceProvider?.GetRequiredService<IInputSanitizer>();

//         if (sanitizer == null)
//         {
//             return new ValidationResult("Phone validation service not available");
//         }

//         var result = sanitizer.SanitizePhoneNumber(phone);

//         if (!result.IsValid)
//         {
//             return new ValidationResult(
//                 string.Join(", ", result.Errors),
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Validation attribute for URLs with sanitization
// /// </summary>
// public class ValidateUrlAttribute : ValidationAttribute
// {
//     /// <summary>
//     /// Allowed URL schemes
//     /// </summary>
//     public string[] AllowedSchemes { get; set; } = { "http", "https" };

//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string url || string.IsNullOrEmpty(url))
//         {
//             return ValidationResult.Success; // Allow null/empty for optional URLs
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var sanitizer = serviceProvider?.GetRequiredService<IInputSanitizer>();

//         if (sanitizer == null)
//         {
//             return new ValidationResult("URL validation service not available");
//         }

//         var sanitized = sanitizer.SanitizeUrl(url);

//         if (string.IsNullOrEmpty(sanitized))
//         {
//             return new ValidationResult(
//                 "Invalid URL format",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         // Validate scheme
//         if (Uri.TryCreate(sanitized, UriKind.Absolute, out var uri))
//         {
//             if (!AllowedSchemes.Contains(uri.Scheme.ToLowerInvariant()))
//             {
//                 return new ValidationResult(
//                     $"URL scheme '{uri.Scheme}' is not allowed. Allowed schemes: {string.Join(", ", AllowedSchemes)}",
//                     validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//             }
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Validation attribute for safe HTML content
// /// </summary>
// public class ValidateSafeHtmlAttribute : ValidationAttribute
// {
//     /// <summary>
//     /// HTML sanitization level
//     /// </summary>
//     public HtmlSanitizationLevel Level { get; set; } = HtmlSanitizationLevel.Basic;

//     /// <summary>
//     /// Maximum allowed length after sanitization
//     /// </summary>
//     public int MaxLength { get; set; } = 10000;

//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string html || string.IsNullOrEmpty(html))
//         {
//             return ValidationResult.Success;
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var sanitizer = serviceProvider?.GetRequiredService<IInputSanitizer>();

//         if (sanitizer == null)
//         {
//             return new ValidationResult("HTML validation service not available");
//         }

//         // Check for injection attempts first
//         var injectionResult = sanitizer.DetectInjectionAttempt(html);
//         if (injectionResult.InjectionDetected && injectionResult.RiskLevel >= RiskLevel.Medium)
//         {
//             return new ValidationResult(
//                 $"Potentially malicious HTML detected: {injectionResult.InjectionType}",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         // Sanitize HTML
//         var sanitized = sanitizer.SanitizeHtml(html, Level);

//         if (sanitized.Length > MaxLength)
//         {
//             return new ValidationResult(
//                 $"HTML content too long. Maximum length: {MaxLength}, actual: {sanitized.Length}",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Validation attribute for file paths
// /// </summary>
// public class ValidateFilePathAttribute : ValidationAttribute
// {
//     /// <summary>
//     /// Allow relative paths
//     /// </summary>
//     public bool AllowRelativePaths { get; set; } = true;

//     /// <summary>
//     /// Allowed file extensions
//     /// </summary>
//     public string[]? AllowedExtensions { get; set; }

//     /// <summary>
//     /// Forbidden file extensions
//     /// </summary>
//     public string[] ForbiddenExtensions { get; set; } = { ".exe", ".bat", ".cmd", ".com", ".scr", ".vbs", ".js" };

//     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
//     {
//         if (value is not string filePath || string.IsNullOrEmpty(filePath))
//         {
//             return ValidationResult.Success;
//         }

//         var serviceProvider = validationContext.GetService<IServiceProvider>();
//         var sanitizer = serviceProvider?.GetRequiredService<IInputSanitizer>();

//         if (sanitizer == null)
//         {
//             return new ValidationResult("File path validation service not available");
//         }

//         // Check for path traversal
//         var injectionResult = sanitizer.DetectInjectionAttempt(filePath);
//         if (injectionResult.InjectionDetected && injectionResult.InjectionType == InjectionType.PathTraversal)
//         {
//             return new ValidationResult(
//                 "Path traversal attempt detected",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         // Sanitize file path
//         var sanitized = sanitizer.SanitizeFilePath(filePath);

//         if (string.IsNullOrEmpty(sanitized))
//         {
//             return new ValidationResult(
//                 "Invalid file path",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         // Check if absolute path is allowed
//         if (!AllowRelativePaths && !Path.IsPathRooted(sanitized))
//         {
//             return new ValidationResult(
//                 "Relative paths are not allowed",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         // Check file extension
//         var extension = Path.GetExtension(sanitized).ToLowerInvariant();

//         if (ForbiddenExtensions.Contains(extension))
//         {
//             return new ValidationResult(
//                 $"File extension '{extension}' is not allowed",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         if (AllowedExtensions != null && AllowedExtensions.Length > 0 && !AllowedExtensions.Contains(extension))
//         {
//             return new ValidationResult(
//                 $"File extension '{extension}' is not in the allowed list: {string.Join(", ", AllowedExtensions)}",
//                 validationContext.MemberName != null ? new[] { validationContext.MemberName } : null);
//         }

//         return ValidationResult.Success;
//     }
// }

// /// <summary>
// /// Model binder for automatic input sanitization
// /// </summary>
// public class SanitizingModelBinder : Microsoft.AspNetCore.Mvc.ModelBinding.IModelBinder
// {
//     private readonly IInputSanitizer _sanitizer;

//     public SanitizingModelBinder(IInputSanitizer sanitizer)
//     {
//         _sanitizer = sanitizer;
//     }

//     public Task BindModelAsync(Microsoft.AspNetCore.Mvc.ModelBinding.ModelBindingContext bindingContext)
//     {
//         var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

//         if (value == Microsoft.AspNetCore.Mvc.ModelBinding.ValueProviderResult.None)
//         {
//             return Task.CompletedTask;
//         }

//         var stringValue = value.FirstValue;

//         if (!string.IsNullOrEmpty(stringValue))
//         {
//             var sanitized = _sanitizer.SanitizeText(stringValue, new TextSanitizationOptions
//             {
//                 AllowHtml = false,
//                 RemoveControlCharacters = true,
//                 NormalizeWhitespace = true
//             });

//             bindingContext.Result = Microsoft.AspNetCore.Mvc.ModelBinding.ModelBindingResult.Successful(sanitized);
//         }
//         else
//         {
//             bindingContext.Result = Microsoft.AspNetCore.Mvc.ModelBinding.ModelBindingResult.Successful(stringValue);
//         }

//         return Task.CompletedTask;
//     }
// }

// /// <summary>
// /// Model binder provider for automatic input sanitization
// /// </summary>
// public class SanitizingModelBinderProvider : Microsoft.AspNetCore.Mvc.ModelBinding.IModelBinderProvider
// {
//     public Microsoft.AspNetCore.Mvc.ModelBinding.IModelBinder? GetBinder(Microsoft.AspNetCore.Mvc.ModelBinding.ModelBinderProviderContext context)
//     {
//         if (context.Metadata.ModelType == typeof(string) || context.Metadata.ModelType == typeof(string?))
//         {
//             // Check if the property has the SanitizeInput attribute
//             var property = context.Metadata.ContainerType?.GetProperty(context.Metadata.PropertyName ?? "");
//             if (property?.GetCustomAttributes(typeof(SanitizeInputAttribute), false).Any() == true)
//             {
//                 var sanitizer = context.Services.GetRequiredService<IInputSanitizer>();
//                 return new SanitizingModelBinder(sanitizer);
//             }
//         }

//         return null;
//     }
// }