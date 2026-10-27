// Report cache keys must include BOTH the salon and the branch. Managers have
// a salonId as well as a branchId, so using salonId alone lets two managers in
// the same salon share branch-scoped report data.
const reportCacheKey = (
  reportName,
  { role, salonId, branchId, suffix = "" },
) => {
  const salonPart = salonId ? String(salonId) : "none";
  const branchPart = branchId ? String(branchId) : "all";
  const tail = suffix ? `:${suffix}` : "";
  return `report:${reportName}:${role}:${salonPart}:${branchPart}${tail}`;
};

module.exports = reportCacheKey;
