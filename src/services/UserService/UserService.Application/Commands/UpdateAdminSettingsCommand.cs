using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class UpdateAdminSettingsCommand : ICommand<AdminSettingsResponse>
{
    public UpdateAdminSettingsRequest? Settings { get; set; }
}