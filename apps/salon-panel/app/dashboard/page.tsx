"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import PunchButton from "@/components/attendance/PunchButton";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { socketClient } from "@/lib/socket-client";

// ── Types ──

interface OverviewData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    noShow: number;
    completionRate: string;
  };
  revenue: { total: number };
}

interface AppointmentItem {
  _id: string;
  customerId: { name: string; email?: string; phone?: string } | string;
  staffId: { name: string } | string;
  serviceId: { name: string; price?: number; durationMinutes?: number } | string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  pricePaid: number;
}

// ── Helpers ──

function getName(field: unknown, defaultVal = "Walk-in"): string {
  if (!field) return defaultVal;
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field)
    return (field as { name: string }).name || defaultVal;
  return defaultVal;
}

function getPhone(field: unknown): string {
  if (typeof field === "object" && field !== null && "phone" in field) {
    return (field as { phone?: string }).phone || "+91 98765 43210";
  }
  return "+91 98765 43210";
}

function formatPrice(price: number): string {
  return `₹${(price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

import { toLocalDateStr } from "@/lib/utils";

function getToday(): string {
  return toLocalDateStr();
}

function getMonthStart(): string {
  return getToday().substring(0, 8) + "01";
}

function getMonthEnd(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return toLocalDateStr(lastDay);
}

// ── Page ──

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "owner") as UserRole;
  const router = useRouter();

  const [todayLoading, setTodayLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [yesterdayLoading, setYesterdayLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [todayOverview, setTodayOverview] = useState<OverviewData | null>(null);
  const [monthOverview, setMonthOverview] = useState<OverviewData | null>(null);
  const [yesterdayRevenue, setYesterdayRevenue] = useState<number>(0);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Prevent overlapping refreshes (socket bursts used to fire several full
  // dashboard reloads at once).
  const inFlightRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  const fetchDashboard = useCallback(async (options: { silent?: boolean } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const today = getToday();
    const monthStart = getMonthStart();
    const monthEnd = getMonthEnd();

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = toLocalDateStr(yesterdayObj);

    // Only show skeletons on the first load. Socket refreshes stay silent so
    // existing values remain visible while new data arrives.
    if (!options.silent) {
      setTodayLoading(true);
      setMonthLoading(true);
      setYesterdayLoading(true);
      setAppointmentsLoading(true);
    }

    try {
      // Each request updates its own section as soon as it resolves, instead
      // of making the whole page wait for the slowest call.
      const requests = [
        apiClient
          .get("/reports/overview", { params: { startDate: today, endDate: today } })
          .then((res) => {
            if (res.data?.data) setTodayOverview(res.data.data);
          })
          .catch(() => {})
          .finally(() => setTodayLoading(false)),

        apiClient
          .get("/reports/overview", { params: { startDate: monthStart, endDate: monthEnd } })
          .then((res) => {
            if (res.data?.data) setMonthOverview(res.data.data);
          })
          .catch(() => {})
          .finally(() => setMonthLoading(false)),

        apiClient
          .get("/reports/overview", { params: { startDate: yesterday, endDate: yesterday } })
          .then((res) => {
            setYesterdayRevenue(res.data?.data?.revenue?.total || 0);
          })
          .catch(() => {})
          .finally(() => setYesterdayLoading(false)),

        apiClient
          .get("/appointments", { params: { limit: 20 } })
          .then((res) => {
            if (res.data) {
              const apptData = res.data.data || res.data;
              const list = Array.isArray(apptData) ? apptData : apptData?.appointments || [];
              setAppointments(list);
            }
          })
          .catch(() => {})
          .finally(() => setAppointmentsLoading(false)),
      ];

      await Promise.allSettled(requests);

      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
        ", " +
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Realtime updates via WebSocket
  useEffect(() => {
    const branchId = user?.branchId || null;
    const salonId = (user as any)?.salonId || null;
    socketClient.connect({ branchId, salonId });

    const handleRealtime = () => {
      // Debounce bursts of appointment events into one background refresh.
      if (refreshTimerRef.current !== null) return;
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        fetchDashboard({ silent: true });
      }, 400);
    };

    const unsub1 = socketClient.onAppointmentCreated(handleRealtime);
    const unsub2 = socketClient.onAppointmentUpdated(handleRealtime);
    const unsub3 = socketClient.onAppointmentStatusChanged(handleRealtime);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user, fetchDashboard]);

  const upcomingList = appointments.slice(0, 5);
  const userName = user?.name?.split(" ")[0] || "Owner";

  const todayCardLoading = todayLoading && !todayOverview;
  const revenueDeltaLoading = todayLoading || yesterdayLoading;
  const monthCardLoading = monthLoading && !monthOverview;
  const appointmentsLoadingEmpty = appointmentsLoading && appointments.length === 0;

  // Compute revenue change vs yesterday
  const todayRev = todayOverview?.revenue?.total ?? 0;
  let vsYesterdayText = "0%";
  if (yesterdayRevenue === 0) {
    vsYesterdayText = todayRev > 0 ? "+100%" : "0%";
  } else {
    const diffPct = Math.round(((todayRev - yesterdayRevenue) / yesterdayRevenue) * 100);
    vsYesterdayText = `${diffPct >= 0 ? "+" : ""}${diffPct}%`;
  }

  return (
    <ProtectedRoute page="dashboard">
      <div className="space-y-4 sm:space-y-5 animate-fade-in pb-2">

        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {userName}.
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Here's your salon performance overview.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl border border-slate-200/80 px-3 py-1.5 shadow-2xs">
            <Clock size={13} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-700">Updated {lastUpdated || "Just now"}</span>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* Card 1: Today's Revenue */}
          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-600">Today's Revenue</p>
              <div className="w-8 h-8 rounded-lg bg-[#e9d5ff] text-[#7e22ce] flex items-center justify-center shadow-2xs shrink-0">
                <BarChart3 size={16} strokeWidth={2.2} />
              </div>
            </div>
            {todayCardLoading ? (
              <Skeleton className="h-8 w-32 mt-0.5" />
            ) : (
              <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {formatPrice(todayOverview?.revenue?.total ?? 0)}
              </p>
            )}
            {revenueDeltaLoading ? (
              <Skeleton className="h-3.5 w-36 mt-2" />
            ) : (
              <div className="flex items-center gap-1 mt-1 text-emerald-600 font-bold text-[11px]">
                <TrendingUp size={12} />
                <span>{vsYesterdayText}</span>
                <span className="text-slate-400 font-normal">vs. yesterday</span>
              </div>
            )}
          </div>

          {/* Card 2: Today's Bookings */}
          <div className="bg-[#f0f7ff] border border-[#e0f2fe] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-600">Today's Bookings</p>
              <div className="w-8 h-8 rounded-lg bg-[#bae6fd] text-[#0284c7] flex items-center justify-center shadow-2xs shrink-0">
                <CalendarDays size={16} strokeWidth={2.2} />
              </div>
            </div>
            {todayCardLoading ? (
              <Skeleton className="h-8 w-20 mt-0.5" />
            ) : (
              <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {todayOverview?.appointments?.total ?? 0}
              </p>
            )}
            {todayCardLoading ? (
              <Skeleton className="h-3.5 w-32 mt-2" />
            ) : (
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                {todayOverview?.appointments?.completed ?? 0} done · {(todayOverview?.appointments?.pending ?? 0) + (todayOverview?.appointments?.confirmed ?? 0)} upcoming
              </p>
            )}
          </div>

          {/* Card 3: Completed Today */}
          <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-600">Completed Today</p>
              <div className="w-8 h-8 rounded-lg bg-[#bbf7d0] text-[#15803d] flex items-center justify-center shadow-2xs shrink-0">
                <CheckCircle2 size={16} strokeWidth={2.2} />
              </div>
            </div>
            {todayCardLoading ? (
              <Skeleton className="h-8 w-20 mt-0.5" />
            ) : (
              <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {todayOverview?.appointments?.completed ?? 0}
              </p>
            )}
            {todayCardLoading ? (
              <Skeleton className="h-3.5 w-32 mt-2" />
            ) : (
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Completion rate: {todayOverview?.appointments?.completionRate ?? "0%"}
              </p>
            )}
          </div>

          {/* Card 4: This Month Revenue */}
          <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-600">This Month Revenue</p>
              <div className="w-8 h-8 rounded-lg bg-[#fed7aa] text-[#c2410c] flex items-center justify-center shadow-2xs font-bold text-sm shrink-0">
                ₹
              </div>
            </div>
            {monthCardLoading ? (
              <Skeleton className="h-8 w-32 mt-0.5" />
            ) : (
              <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {formatPrice(monthOverview?.revenue?.total ?? 0)}
              </p>
            )}
            {monthCardLoading ? (
              <Skeleton className="h-3.5 w-24 mt-2" />
            ) : (
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                {monthOverview?.appointments?.total ?? 0} booking{(monthOverview?.appointments?.total ?? 0) !== 1 ? "s" : ""}
              </p>
            )}
          </div>

        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">

          {/* Left Column (2 Cols wide): Upcoming Appointments */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Upcoming Appointments
                  </h2>
                  <p className="text-[11px] font-medium text-slate-400">
                    Next appointments to handle
                  </p>
                </div>
                <button
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={13} />
                </button>
              </div>

              {/* Appointments Table */}
              {appointmentsLoadingEmpty ? (
                <div className="space-y-3 py-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-3.5 w-12" />
                      <Skeleton className="h-3.5 flex-1" />
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  ))}
                </div>
              ) : upcomingList.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <CalendarDays size={18} />
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">No upcoming appointments scheduled</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    Bookings made by customers will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-2 pr-3 font-bold">TIME</th>
                        <th className="pb-2 px-3 font-bold">CUSTOMER</th>
                        <th className="pb-2 px-3 font-bold">SERVICE</th>
                        <th className="pb-2 px-3 font-bold">STAFF</th>
                        <th className="pb-2 px-3 font-bold">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {upcomingList.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 pr-3 font-bold text-xs text-slate-900 whitespace-nowrap">
                            {item.startTime}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900">{getName(item.customerId)}</p>
                            <p className="text-[10px] font-medium text-slate-400">{getPhone(item.customerId)}</p>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900">{getName(item.serviceId, "Hair Cut")}</p>
                            <p className="text-[10px] font-medium text-slate-400">30 min</p>
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium text-slate-400 whitespace-nowrap">
                            {getName(item.staffId, "—")}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="bg-[#e8f0fe] text-[#0071e3] px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-block">
                              {item.status || "Upcoming"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col wide): Punch + Quick Actions + Recent Bookings */}
          <div className="space-y-4">

            {/* Punch In/Out Widget (staff & manager) */}
            {(role === "staff" || role === "manager") && <PunchButton />}

            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Manage Bookings */}
                <button
                  onClick={() => router.push("/bookings")}
                  className="bg-[#f5f3ff] text-[#0071e3] hover:bg-[#ede9fe] border border-[#ede9fe] rounded-xl p-2.5 flex items-center justify-between text-xs font-bold transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarDays size={15} className="shrink-0" />
                    <span className="truncate">Manage Bookings</span>
                  </div>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 2. View Schedule */}
                <button
                  onClick={() => router.push("/schedule")}
                  className="bg-[#f0f7ff] text-[#0284c7] hover:bg-[#e0f2fe] border border-[#e0f2fe] rounded-xl p-2.5 flex items-center justify-between text-xs font-bold transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock size={15} className="shrink-0" />
                    <span className="truncate">View Schedule</span>
                  </div>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 3. Staff Management */}
                <button
                  onClick={() => router.push("/staff")}
                  className="bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#dcfce7] rounded-xl p-2.5 flex items-center justify-between text-xs font-bold transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={15} className="shrink-0" />
                    <span className="truncate">Staff Management</span>
                  </div>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 4. View Reports */}
                <button
                  onClick={() => router.push("/reports")}
                  className="bg-[#fff7ed] text-[#ea580c] hover:bg-[#ffedd5] border border-[#ffedd5] rounded-xl p-2.5 flex items-center justify-between text-xs font-bold transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BarChart3 size={15} className="shrink-0" />
                    <span className="truncate">View Reports</span>
                  </div>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Recent Bookings Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Recent Bookings
                </h2>
                <button
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {appointmentsLoadingEmpty ? (
                <div className="space-y-2.5 py-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 flex-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              ) : upcomingList.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 py-3 text-center">No recent bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-2 pr-2 font-bold">CUSTOMER</th>
                        <th className="pb-2 px-2 font-bold">SERVICE</th>
                        <th className="pb-2 px-2 font-bold">DATE & TIME</th>
                        <th className="pb-2 pl-2 text-right font-bold">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upcomingList.slice(0, 3).map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 pr-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900">{getName(item.customerId)}</p>
                            <p className="text-[10px] font-medium text-slate-400">{getPhone(item.customerId)}</p>
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900">{getName(item.serviceId, "Hair Cut")}</p>
                            <p className="text-[10px] font-medium text-slate-400">30 min</p>
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900">{item.date || getToday()}</p>
                            <p className="text-[10px] font-medium text-slate-400">{item.startTime}</p>
                          </td>
                          <td className="py-2 pl-2 text-right whitespace-nowrap">
                            <span className="bg-[#e8f0fe] text-[#0071e3] px-2 py-0.5 rounded-md text-[10px] font-bold inline-block">
                              {item.status || "Upcoming"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}