namespace NotificationService.Infrastructure.Services;

// ============================================================================
// TEMPLATE ENGINE SERVICE
// ============================================================================

public interface ITemplateEngine
{
    string RenderTemplate(string template, Dictionary<string, string> variables);
}
