import apiClient from "@/lib/api-client";
import type { ApiResponse, Attendance, AttendanceSummary } from "@/lib/api";

export async function punchIn(notes?: string): Promise<ApiResponse<Attendance>> {
  const { data } = await apiClient.post<ApiResponse<Attendance>>("/attendance/punch-in", { notes });
  return data;
}

export async function punchOut(notes?: string): Promise<ApiResponse<Attendance>> {
  const { data } = await apiClient.post<ApiResponse<Attendance>>("/attendance/punch-out", { notes });
  return data;
}

export async function getTodayStatus(): Promise<Attendance | null> {
  const { data } = await apiClient.get<ApiResponse<Attendance | null>>("/attendance/me/today");
  return data.data ?? null;
}

export async function getMyAttendance(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Attendance[]> {
  const { data } = await apiClient.get<ApiResponse<Attendance[]>>("/attendance/me", { params });
  return data.data ?? [];
}

export async function getBranchAttendance(
  branchId: string,
  params?: { startDate?: string; endDate?: string; staffId?: string },
): Promise<Attendance[]> {
  const { data } = await apiClient.get<ApiResponse<Attendance[]>>(
    `/attendance/branch/${branchId}`,
    { params },
  );
  return data.data ?? [];
}

export async function getAttendanceSummary(
  branchId: string,
  params?: { startDate?: string; endDate?: string },
): Promise<AttendanceSummary[]> {
  const { data } = await apiClient.get<ApiResponse<AttendanceSummary[]>>(
    `/attendance/branch/${branchId}/summary`,
    { params },
  );
  return data.data ?? [];
}
