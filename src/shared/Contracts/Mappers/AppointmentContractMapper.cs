//using Contracts.Appointment.Requests;
//using Contracts.Appointment.Responses;

//namespace Contracts.Mappers;

///// <summary>
///// Mapper for Appointment service contracts to CQRS commands/queries
///// This will be implemented in the AppointmentService to avoid circular dependencies
///// </summary>
//public interface IAppointmentContractMapper
//{
//    // Create Appointment Mapping
//    CreateAppointmentCommand MapToCommand(CreateAppointmentRequest request, string? userId = null);
//    CreateAppointmentResponse MapToResponse(CreateAppointmentCommandResponse commandResponse);

//    // Accept Appointment Mapping
//    AcceptAppointmentCommand MapToCommand(AcceptAppointmentRequest request, string? userId = null);
//    AcceptAppointmentResponse MapToResponse(AcceptAppointmentCommandResponse commandResponse);

//    // Cancel Appointment Mapping
//    CancelAppointmentCommand MapToCommand(CancelAppointmentRequest request, string? userId = null);
//    CancelAppointmentResponse MapToResponse(CancelAppointmentCommandResponse commandResponse);

//    // Reschedule Appointment Mapping
//    RescheduleAppointmentCommand MapToCommand(RescheduleAppointmentRequest request, string? userId = null);
//    RescheduleAppointmentResponse MapToResponse(RescheduleAppointmentCommandResponse commandResponse);

//    // Get Appointment Details Mapping
//    GetAppointmentDetailsQuery MapToQuery(GetAppointmentDetailsRequest request, string? userId = null);
//    GetAppointmentDetailsResponse MapToResponse(GetAppointmentDetailsQueryResponse queryResponse);

//    // Get User Appointments Mapping
//    GetUserAppointmentsQuery MapToQuery(GetUserAppointmentsRequest request, string? userId = null);
//    GetUserAppointmentsResponse MapToResponse(GetUserAppointmentsQueryResponse queryResponse);
//}

//// Placeholder types - these will reference actual CQRS types in AppointmentService
//public interface CreateAppointmentCommand { }
//public interface CreateAppointmentCommandResponse { }
//public interface AcceptAppointmentCommand { }
//public interface AcceptAppointmentCommandResponse { }
//public interface CancelAppointmentCommand { }
//public interface CancelAppointmentCommandResponse { }
//public interface RescheduleAppointmentCommand { }
//public interface RescheduleAppointmentCommandResponse { }
//public interface GetAppointmentDetailsQuery { }
//public interface GetAppointmentDetailsQueryResponse { }
//public interface GetUserAppointmentsQuery { }
//public interface GetUserAppointmentsQueryResponse { }