// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class TemplatePreviewResponse
{
    public string Subject { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string TextContent { get; set; } = string.Empty;
    public List<string> MissingVariables { get; set; } = new();
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}
