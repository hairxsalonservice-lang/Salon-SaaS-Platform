import type { BackendUser } from "@/lib/api";
import type { User, Page } from "@/lib/types";

type RefLike = string | { _id?: string } | null | undefined;

const refId = (value: RefLike): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value._id;
};

export const mapUser = (user: BackendUser & { salon?: RefLike; branch?: RefLike }): User => {
  return {
    id: user.id || user._id || "",
    email: user.email,
    name: user.name,
    role: user.role,
    initials: user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "",
    // /auth/login returns ids directly; /auth/me returns populated
    // salon/branch objects. Keep both so the panel can scope UI actions
    // (e.g. the New Booking modal) to the signed-in user's branch.
    salonId: refId(user.salonId) || refId(user.salon),
    branchId: refId(user.branchId) || refId(user.branch),
  };
};

export const getCurrentPage = (path: string): Page => {
  const page = path.split("/")[1];

  const validPages: Page[] = [
    "dashboard",
    "bookings",
    "customers",
    "services",
    "reports",
    "schedule",
    "notifications",
    "branches",
    "staff",
  ];

  if (validPages.includes(page as Page)) {
    return page as Page;
  }

  return "dashboard";
};

export const getUserRole = (role: string) => {
  const validRoles = ["owner", "manager", "staff"];
  if (validRoles.includes(role)) return role;
  return "staff";
};
