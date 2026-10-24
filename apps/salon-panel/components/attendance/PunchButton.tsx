"use client";

import { useState, useEffect, useRef } from "react";
import { LogIn, LogOut, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getTodayStatus, punchIn, punchOut } from "@/api/services/attendanceService";
import type { Attendance } from "@/lib/api";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function PunchButton({ onStatusChange }: { onStatusChange?: () => void } = {}) {
  const [status, setStatus] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getTodayStatus()
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (status?.status === "ACTIVE" && status.punchInTime) {
      const update = () => {
        const diff = Math.round((Date.now() - new Date(status.punchInTime).getTime()) / 60000);
        setElapsed(diff);
      };
      update();
      timerRef.current = setInterval(update, 60000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  async function handlePunchIn() {
    setActing(true);
    setError("");
    try {
      const res = await punchIn();
      setStatus(res.data ?? null);
      onStatusChange?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to punch in. Please try again.");
    } finally {
      setActing(false);
    }
  }

  async function handlePunchOut() {
    setActing(true);
    setError("");
    try {
      const res = await punchOut();
      setStatus(res.data ?? null);
      onStatusChange?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to punch out. Please try again.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Completed session
  if (status?.status === "COMPLETED" || status?.status === "AUTO_CLOSED") {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Attendance</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Session Complete</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatTime(status.punchInTime)} — {status.punchOutTime ? formatTime(status.punchOutTime) : "—"}
              <span className="ml-2 font-semibold text-slate-700">{formatElapsed(status.totalMinutes)}</span>
            </p>
          </div>
          {status.isLate && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
              Late by {status.lateByMinutes}m
            </span>
          )}
        </div>
      </div>
    );
  }

  // Active session — show punch out
  if (status?.status === "ACTIVE") {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working</span>
          <span className="text-xs font-bold text-slate-800 ml-auto">{formatElapsed(elapsed)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Punched in at <span className="font-semibold text-slate-700">{formatTime(status.punchInTime)}</span>
          </p>
          <button
            onClick={handlePunchOut}
            disabled={acting}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            <LogOut size={14} />
            {acting ? "..." : "Punch Out"}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-500 font-medium">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // No session — show punch in
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
      </div>
      <button
        onClick={handlePunchIn}
        disabled={acting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
      >
        <LogIn size={15} />
        {acting ? "Punching in..." : "Punch In"}
      </button>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-500 font-medium">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
