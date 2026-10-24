import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import apiClient, { tokenStorage } from "@/lib/api-client";
import type { UserRole } from "@/lib/api";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(id: any): boolean {
  return typeof id === "string" && OBJECT_ID_REGEX.test(id);
}

export function useBranch() {
  const dispatch = useDispatch();
  const { user, selectedBranch, salon } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "staff") as UserRole;
  const canManage = role === "owner" || role === "manager";

  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const token = tokenStorage.getAccessToken();
  let decoded: any = null;
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        decoded = JSON.parse(jsonPayload);
      }
    } catch (e) {}
  }

  const rawSalonId =
    salon?._id ||
    (typeof salon === "string" ? salon : null) ||
    decoded?.salonId ||
    (typeof user?.salonId === "object" ? (user?.salonId as any)?._id : user?.salonId) ||
    "";
  const salonId = isValidObjectId(rawSalonId) ? rawSalonId : "";

  const rawUserBranchId =
    decoded?.branchId ||
    (typeof user?.branchId === "object" ? (user?.branchId as any)?._id : user?.branchId) ||
    "";
  const userBranchId = isValidObjectId(rawUserBranchId) ? rawUserBranchId : "";

  const rawSelectedBranchId =
    typeof selectedBranch === "object" ? (selectedBranch as any)?._id : selectedBranch;
  const selectedBranchId = isValidObjectId(rawSelectedBranchId) ? rawSelectedBranchId : "";

  // Owner uses the selected branch, others use their assigned branch
  const branchId = selectedBranchId || userBranchId || "";

  useEffect(() => {
    if (!salonId) return;
    async function fetchBranches() {
      setBranchesLoading(true);
      try {
        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const branchList = data.data?.branches || [];
        setBranches(branchList);
        if (!selectedBranchId && branchList.length > 0) {
          const targetBranch = userBranchId
            ? branchList.find((b: any) => b._id === userBranchId) || branchList[0]
            : branchList[0];
          dispatch(selectBranch(targetBranch));
        }
      } catch (e) {
      } finally {
        setBranchesLoading(false);
      }
    }
    fetchBranches();
  }, [salonId, userBranchId, dispatch, selectedBranchId]);

  return {
    salonId,
    branchId,
    selectedBranch,
    role,
    canManage,
    branchesLoading,
    branches,
    hasBranches: branches.length > 0 || !!branchId,
  };
}