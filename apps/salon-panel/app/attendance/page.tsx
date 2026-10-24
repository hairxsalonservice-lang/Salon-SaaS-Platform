"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useBranch } from "@/hooks/useBranch";
import {
  getMyAttendance,
  getBranchAttendance,
  getAttendanceSummary,
} from "@/api/services/attendanceService";
import type { Attendance, AttendanceSummary } from "@/lib/api";
import {
  Clock,
  CalendarDays,
  AlertCircle,
  Users,
  TrendingUp,
  Timer,
  RefreshCw,
} from "lucide-react";
import PunchButton from "@/components/attendance/PunchButton";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function getMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

export default function AttendancePage() {
  const { branchId, role, canManage } = useBranch();
  const selfMode = role === "staff";

  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState(getMonthRange);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (selfMode) {
        const data = await getMyAttendance(dateRange);
        setRecords(data);
      } else if (branchId) {
        const [recs, sum] = await Promise.all([
          getBranchAttendance(branchId, dateRange),
          getAttendanceSummary(branchId, dateRange),
        ]);
        setRecords(recs);
        setSummary(sum);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [selfMode, branchId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDays = selfMode ? records.length : summary.reduce((s, r) => s + r.totalDays, 0);
  const totalHours = selfMode
    ? Math.round(records.reduce((s, r) => s + r.totalMinutes, 0) / 60 * 10) / 10
    : summary.reduce((s, r) => s + r.totalHours, 0);
  const lateDays = selfMode
    ? records.filter((r) => r.isLate).length
    : summary.reduce((s, r) => s + r.lateDays, 0);
  const avgHours = totalDays > 0 ? Math.round((totalHours / totalDays) * 10) / 10 : 0;

  return (
    <ProtectedRoute page="attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {selfMode ? "My Attendance" : "Staff Attendance"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {selfMode ? "Track your punch in/out history" : "Monitor your team's attendance"}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {/* Punch Button for staff/manager */}
        {(role === "staff" || role === "manager") && <PunchButton />}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={14} className="text-[#5542f6]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Present</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{totalDays}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hours</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{totalHours}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-rose-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late Days</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{lateDays}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Hours/Day</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{avgHours}</p>
          </div>
        </div>

        {/* Staff Summary Table (owner/manager only) */}
        {canManage && summary.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Users size={15} className="text-[#5542f6]" />
              <h2 className="text-sm font-extrabold text-slate-800">Staff Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-2.5 font-bold text-slate-500">Staff</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Days</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Hours</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Avg/Day</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Late</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.staffId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-800">{s.staffName}</td>
                      <td className="text-center px-3 py-3 text-slate-600">{s.totalDays}</td>
                      <td className="text-center px-3 py-3 text-slate-600">{s.totalHours}h</td>
                      <td className="text-center px-3 py-3 text-slate-600">{s.avgHoursPerDay}h</td>
                      <td className="text-center px-3 py-3">
                        {s.lateDays > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/60">
                            {s.lateDays} ({s.latePercentage}%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Records Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Timer size={15} className="text-[#5542f6]" />
            <h2 className="text-sm font-extrabold text-slate-800">Attendance Log</h2>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-500">No attendance records</p>
              <p className="text-xs text-slate-400 mt-1">Records will appear once staff start punching in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {!selfMode && <th className="text-left px-5 py-2.5 font-bold text-slate-500">Staff</th>}
                    <th className="text-left px-5 py-2.5 font-bold text-slate-500">Date</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Punch In</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Punch Out</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Hours</th>
                    <th className="text-center px-3 py-2.5 font-bold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const staffName = typeof r.staffId === "object" ? r.staffId.name : "";
                    return (
                      <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        {!selfMode && <td className="px-5 py-3 font-bold text-slate-800">{staffName}</td>}
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="text-center px-3 py-3 text-slate-600 font-semibold">{formatTime(r.punchInTime)}</td>
                        <td className="text-center px-3 py-3 text-slate-600 font-semibold">
                          {r.punchOutTime ? formatTime(r.punchOutTime) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200/60 text-[10px]">Active</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-3 font-bold text-slate-800">
                          {r.status === "ACTIVE" ? "—" : formatHours(r.totalMinutes)}
                        </td>
                        <td className="text-center px-3 py-3">
                          {r.isLate ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/60 text-[10px]">
                              Late {r.lateByMinutes}m
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/60 text-[10px]">
                              On Time
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
