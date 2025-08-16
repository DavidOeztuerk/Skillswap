namespace NotificationService.Infrastructure.Services;

public interface ITemplateEngine
{
    string RenderTemplate(string template, Dictionary<string, string> variables);
}
