"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  Scissors,
  UserCog,
  CalendarOff,
  GitBranch,
  BarChart3,
  Bell,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  KeyRound,
  Image as ImageIcon,
  Fingerprint,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { type AppPage, PAGE_ACCESS } from "@/lib/rbac";
import { useState, useEffect } from "react";
import {
  bumpUnreadCount,
  getUnreadCount,
  seedUnreadCount,
} from "@/api/services/notificationService";
import { socketClient } from "@/lib/socket-client";

interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ElementType;
  group: "main" | "manage" | "other";
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard",     label: "Dashboard",      icon: LayoutDashboard, group: "main" },
  { page: "bookings",      label: "Bookings",       icon: CalendarDays,    group: "main" },
  { page: "schedule",      label: "Schedule",       icon: Clock,           group: "main" },
  { page: "customers",     label: "Customers",      icon: Users,           group: "main" },
  { page: "services",      label: "Services",       icon: Scissors,        group: "manage" },
  { page: "staff",         label: "Staff",          icon: UserCog,         group: "manage" },
  { page: "attendance",    label: "Attendance",     icon: Fingerprint,     group: "manage" },
  { page: "leaves",        label: "Leaves",         icon: CalendarOff,     group: "manage" },
  { page: "branches",      label: "Branches",       icon: GitBranch,       group: "manage" },
  { page: "gallery",       label: "Gallery",        icon: ImageIcon,       group: "manage" },
  { page: "reports",       label: "Reports",        icon: BarChart3,       group: "manage" },
  { page: "notifications", label: "Notifications",  icon: Bell,            group: "other" },
];

interface SidebarProps {
  currentPage: AppPage;
  role: UserRole;
  name: string;
  email: string;
  initials: string;
  userId?: string | null;
  isOpen: boolean;
  collapsed: boolean;
  salonName: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onChangePassword?: () => void;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentPage,
  role,
  name,
  email,
  initials,
  userId,
  isOpen,
  collapsed,
  salonName,
  onNavigate,
  onLogout,
  onChangePassword,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const [unread, setUnread] = useState(0);
  const UNREAD_POLL_MS = 120000;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {}
    };
    poll();
    const timer = setInterval(poll, UNREAD_POLL_MS);

    const handleUnreadEvent = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("notifications_unread_updated", handleUnreadEvent);
    }

    if (userId) {
      socketClient.connect();
      socketClient.setUserId(userId);
    }
    const offNotif = socketClient.onNotificationNew(() => {
      setUnread((prev) => {
        bumpUnreadCount(1);
        return prev + 1;
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications_unread_updated", handleUnreadEvent);
      }
      offNotif();
    };
  }, [userId]);

  const visibleItems = NAV_ITEMS.filter((item) =>
    PAGE_ACCESS[item.page]?.includes(role),
  );

  const mainItems = visibleItems.filter((i) => i.group === "main");
  const manageItems = visibleItems.filter((i) => i.group === "manage");
  const otherItems = visibleItems.filter((i) => i.group === "other");

  function handleNavigate(page: AppPage) {
    onNavigate(page);
    onClose();
  }

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[240px]";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white/80 backdrop-blur-2xl
          border-r border-[#d2d2d7]/50
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div className={`px-4 pt-4 pb-5 shrink-0 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.png"
                alt="HairX"
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wider text-[#86868b] uppercase">
                  HairX
                </p>
                <h1 className="text-[13px] font-semibold text-[#1d1d1f] leading-tight truncate">
                  {salonName || "Salon"}
                </h1>
              </div>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="HairX"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors p-1 rounded-md hover:bg-[#f5f5f7]"
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 overflow-y-auto space-y-4 scrollbar-thin">
          <NavGroup items={mainItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />

          {manageItems.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-wider text-[#aeaeb2] uppercase px-2.5 mb-1.5">
                  Manage
                </p>
              )}
              {collapsed && <div className="border-t border-[#e5e5ea] mx-2 mb-2" />}
              <NavGroup items={manageItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
            </div>
          )}

          {otherItems.length > 0 && (
            <div>
              {collapsed && <div className="border-t border-[#e5e5ea] mx-2 mb-2" />}
              <NavGroup items={otherItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
            </div>
          )}
        </nav>

        {/* Profile Footer */}
        <div className="p-2.5 border-t border-[#e5e5ea]/60 shrink-0">
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2.5 px-1.5 py-1"}`}>
            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
              {initials || "?"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1d1d1f] truncate">{name || "User"}</p>
                <p className="text-[10px] font-medium text-[#86868b] capitalize">{role || "Owner"}</p>
              </div>
            )}
            {!collapsed ? (
              <div className="flex items-center gap-0.5 shrink-0">
                {onChangePassword && (
                  <button
                    onClick={onChangePassword}
                    title="Change Password"
                    className="text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors p-1.5 rounded-lg"
                  >
                    <KeyRound size={15} strokeWidth={1.75} />
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="text-[#aeaeb2] hover:text-[#ff3b30] hover:bg-red-50 transition-colors p-1.5 rounded-lg"
                >
                  <LogOut size={15} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {onChangePassword && (
                  <button
                    onClick={onChangePassword}
                    title="Change Password"
                    className="text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors p-1.5 rounded-lg"
                  >
                    <KeyRound size={15} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavGroup({
  items,
  currentPage,
  collapsed,
  onNavigate,
  unread,
}: {
  items: NavItem[];
  currentPage: AppPage;
  collapsed: boolean;
  onNavigate: (page: AppPage) => void;
  unread: number;
}) {
  return (
    <div className="space-y-0.5">
      {items.map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        const showBadge = page === "notifications" && unread > 0;
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            title={collapsed ? label : undefined}
            className={`
              relative w-full flex items-center gap-3 rounded-lg text-[12px] font-medium
              transition-all duration-150
              ${collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2"}
              ${
                active
                  ? "bg-[#f5f5f7] text-[#1d1d1f]"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]/60"
              }
            `}
          >
            <Icon
              size={17}
              strokeWidth={active ? 2 : 1.5}
              className={active ? "text-[#0071e3]" : "text-[#86868b]"}
            />
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {showBadge && (
              <span
                className={`rounded-full bg-[#ff3b30] text-white text-[9px] font-bold flex items-center justify-center h-[16px] min-w-[16px] px-1 shrink-0 ${
                  collapsed ? "absolute top-0.5 right-0.5" : ""
                }`}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
