using HandlebarsDotNet;

namespace NotificationService.Infrastructure.Services;

public class HandlebarsTemplateEngine : ITemplateEngine
{
    private readonly ILogger<HandlebarsTemplateEngine> _logger;

    public HandlebarsTemplateEngine(ILogger<HandlebarsTemplateEngine> logger)
    {
        _logger = logger;
    }

    public string RenderTemplate(string template, Dictionary<string, string> variables)
    {
        try
        {
            var compiledTemplate = Handlebars.Compile(template);
            return compiledTemplate(variables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to render template: {Template}", template);
            return template; // Return original template if rendering fails
        }
    }
}
