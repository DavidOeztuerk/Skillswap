namespace Events;

public record DataPortabilityRequestEvent(
    string UserId,
    string RequestType,
    string DeliveryMethod);
