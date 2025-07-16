namespace Events.Integration.Compliance;

public record DataPortabilityRequestEvent(
    string UserId,
    string RequestType,
    string DeliveryMethod);
