namespace NotificationService.Domain.Services;

/// <summary>
/// Template engine interface for rendering notification templates
/// </summary>
public interface ITemplateEngine
{
    string RenderTemplate(string template, Dictionary<string, string> variables);
}
