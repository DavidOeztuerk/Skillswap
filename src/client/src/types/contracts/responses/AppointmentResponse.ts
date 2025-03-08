import { AppointmentStatus } from "../../models/Appointment";

export interface AppointmentResponse {
  appointmentId: string;
  status: AppointmentStatus;
}
