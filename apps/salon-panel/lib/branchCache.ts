import apiClient from "@/lib/api-client";
import { getCached, setCache } from "@/lib/cache";

// Shared branch cache.
//
// Branch data is needed by the top bar, the branch selector, the "no branch"
// prompt and several pages. Fetching it separately in each component caused
// two or three identical requests on every dashboard load. This module keeps
// one in-flight request per salon and reuses the result for a short period.
//
// The cache key matches the `branches_` prefix already used by
// `app/branches/page.tsx`, so its `invalidateCache("branches_")` calls also
// clear this cache.

export interface BranchRecord {
  _id: string;
  name: string;
  isActive?: boolean;
  deactivatedByAdmin?: boolean;
  adminDeactivationReason?: string;
  address?: { city?: string; state?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const inFlight = new Map<string, Promise<BranchRecord[]>>();

export async function fetchBranches<T = BranchRecord>(
  salonId: string,
  options: { force?: boolean } = {},
): Promise<T[]> {
  if (!salonId) return [];

  const cacheKey = `branches_${salonId}`;
  if (!options.force) {
    const cached = getCached<T[]>(cacheKey, CACHE_TTL_MS);
    if (cached) return cached;
  }

  const existing = inFlight.get(cacheKey);
  if (existing) return existing as unknown as Promise<T[]>;

  const request = apiClient
    .get(`/salons/${salonId}/branches`)
    .then(({ data }) => {
      const list: BranchRecord[] = data.data?.branches || data.data || [];
      setCache(cacheKey, list);
      return list;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request as unknown as Promise<T[]>;
}
