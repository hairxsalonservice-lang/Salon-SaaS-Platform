// ============================================================
// api/services/appointmentService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  BookAppointmentPayload,
  UpdateStatusPayload,
  ReschedulePayload,
  RateAppointmentPayload,
  StaffBookingPayload,
  StaffCustomerLookup,
} from "@/lib/api";

/**
 * Generate a UUID v4 for the Idempotency-Key header.
 * Uses crypto.randomUUID where available, falls back to a simple generator.
 */
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function bookAppointment(payload: BookAppointmentPayload, idempotencyKey?: string) {
  const { data } = await apiClient.post<ApiResponse<Appointment>>("/appointments", payload, {
    headers: { "Idempotency-Key": idempotencyKey || generateIdempotencyKey() },
  });
  return data;
}

export async function getAppointments(params?: { status?: string; branchId?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Appointment>>("/appointments", { params });
  return data;
}

/**
 * Create an appointment on behalf of a walk-in / phone customer.
 * Staff, manager and owner roles can call this endpoint.
 */
export async function createStaffAppointment(
  payload: StaffBookingPayload,
  idempotencyKey?: string,
) {
  const { data } = await apiClient.post<ApiResponse<Appointment>>(
    "/appointments/staff",
    payload,
    {
      headers: {
        "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
      },
    },
  );
  return data;
}

/**
 * Exact-phone lookup scoped to customers already known to this salon.
 * Returns `{ customer: null }` when the number is unknown.
 */
export async function lookupCustomerByPhone(phone: string) {
  const { data } = await apiClient.get<ApiResponse<StaffCustomerLookup>>(
    "/appointments/staff/customer-lookup",
    { params: { phone } },
  );
  return data;
}

export async function getAppointment(appointmentId: string) {
  const { data } = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${appointmentId}`);
  return data;
}

export async function updateAppointmentStatus(appointmentId: string, payload: UpdateStatusPayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/status`,
    payload,
  );
  return data;
}

export async function rescheduleAppointment(appointmentId: string, payload: ReschedulePayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return data;
}

export async function rateAppointment(appointmentId: string, payload: RateAppointmentPayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/rate`,
    payload,
  );
  return data;
}