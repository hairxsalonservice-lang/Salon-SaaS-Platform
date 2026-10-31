"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import { fetchBranches } from "@/lib/branchCache";
import { defer } from "@/lib/defer";
import { getUnreadCount } from "@/api/services/notificationService";
import { MapPin, ChevronDown, Check, AlertCircle, Bell } from "lucide-react";

interface BranchOption {
  _id: string;
  name: string;
  isActive?: boolean;
  deactivatedByAdmin?: boolean;
  adminDeactivationReason?: string;
  address?: { city: string; state: string };
}

export default function BranchTopBar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, salon, selectedBranch } = useSelector((state: RootState) => state.auth);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const role = user?.role;

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {}
    };

    // Unread count is decorative; let the dashboard requests start first.
    const start = defer(() => { fetchUnread(); }, 900);
    const interval = setInterval(fetchUnread, 30000);

    const handleUnreadEvent = () => { fetchUnread(); };

    if (typeof window !== "undefined") {
      window.addEventListener("notifications_unread_updated", handleUnreadEvent);
    }

    return () => {
      cancelled = true;
      start();
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications_unread_updated", handleUnreadEvent);
      }
    };
  }, []);

  useEffect(() => {
    if (!role) return;

    const salonId =
      salon?._id ||
      (typeof salon === "string" ? salon : null) ||
      (user as any)?.salonId ||
      (user as any)?.salon?._id ||
      (user as any)?.salon;

    if (!salonId) return;

    let cancelled = false;

    const start = defer(async () => {
      try {
        // Shared cache/in-flight request: the selector modal, the no-branch
        // prompt and page hooks all reuse this result.
        const list = await fetchBranches<BranchOption>(salonId);
        if (cancelled) return;

        setBranches(list);

        if (!selectedBranch && list.length > 0) {
          const first = list[0];
          dispatch(selectBranch({
            _id: first._id, name: first.name, isActive: first.isActive,
            deactivatedByAdmin: first.deactivatedByAdmin,
            adminDeactivationReason: first.adminDeactivationReason,
          }));
        } else if (selectedBranch) {
          const current = list.find((b) => b._id === selectedBranch._id);
          if (current) {
            dispatch(selectBranch({
              _id: current._id, name: current.name, isActive: current.isActive,
              deactivatedByAdmin: current.deactivatedByAdmin,
              adminDeactivationReason: current.adminDeactivationReason,
            }));
          }
        }
      } catch {}
    }, 250);

    return () => {
      cancelled = true;
      start();
    };
  }, [role, salon, dispatch]);

  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDateStr(now.toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  if (role !== "owner" && role !== "manager") return null;
  if (!selectedBranch && branches.length === 0) return null;

  return (
    <div className="relative">
      <div className="h-11 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/40 px-5 flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          <MapPin size={14} className="text-[#0071e3]" />
          <span className="font-semibold text-[#1d1d1f]">
            {selectedBranch?.name || "Select Branch"}
          </span>
          {selectedBranch && selectedBranch.isActive === false && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#ff3b30]/10 text-[#ff3b30]">
              Inactive
            </span>
          )}
          <ChevronDown size={13} className={`text-[#aeaeb2] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-[#86868b] hidden md:inline">
            {currentDateStr}
          </span>
          <button
            onClick={() => router.push("/notifications")}
            className="relative"
            title="Notifications"
          >
            <div className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center text-[#6e6e73] transition-colors">
              <Bell size={15} />
            </div>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff3b30] text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <div className="w-7 h-7 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-semibold">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
          </div>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-4 mt-1.5 bg-white/95 backdrop-blur-xl border border-[#d2d2d7]/60 rounded-xl shadow-lg shadow-black/8 z-50 w-[260px] py-1 animate-slide-up">
            {role === "owner" && (
              <button
                onClick={() => { dispatch(selectBranch(null)); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                  !selectedBranch ? "bg-[#0071e3]/5" : "hover:bg-[#f5f5f7]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium ${!selectedBranch ? "text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                    All Branches
                  </p>
                  <p className="text-[10px] text-[#86868b]">View across all locations</p>
                </div>
                {!selectedBranch && <Check size={13} className="text-[#0071e3] shrink-0" />}
              </button>
            )}

            {role === "owner" && <div className="border-t border-[#e5e5ea]/60 my-0.5" />}

            {branches.map((b) => {
              const isSelected = b._id === selectedBranch?._id;
              const isBranchInactive = b.isActive === false;
              return (
                <button
                  key={b._id}
                  onClick={() => {
                    dispatch(selectBranch({
                      _id: b._id, name: b.name, isActive: b.isActive,
                      deactivatedByAdmin: b.deactivatedByAdmin,
                      adminDeactivationReason: b.adminDeactivationReason,
                    }));
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-[#0071e3]/5" : "hover:bg-[#f5f5f7]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[12px] font-medium ${isSelected ? "text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                        {b.name}
                      </p>
                      {isBranchInactive && (
                        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-[#ff3b30]/10 text-[#ff3b30]">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#86868b] mt-0.5">
                      {b.address?.city ? `${b.address.city}, ${b.address.state || ""}` : "No location"}
                    </p>
                  </div>
                  {isSelected && <Check size={13} className="text-[#0071e3] shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
