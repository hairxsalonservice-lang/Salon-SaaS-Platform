const crypto = require("crypto");
const path = require("path");

/**
 * Central object-key builder.
 *
 * New uploads use readable tenant folders:
 *   salons/{salon}_{owner}_{branch}_{city-state}_{salon-hash}/gallery/{batch}/1.webp
 *   salons/{salon}_{owner}_{branch}_{city-state}_{salon-hash}/branding/{batch}/1.webp
 *   salons/.../branches/{branch}_{city-state}_{branch-hash}/services/{batch}/1.webp
 *   salons/.../branches/{branch}_{city-state}_{branch-hash}/staff/{batch}/1.webp
 *   users/{userId}/avatars/...                   customer/user assets
 *   platform/banners/...                         admin/platform assets
 *
 * The readable parts are cosmetic. A short hash of the tenant id keeps the
 * folder unique when two salons or branches share a name, and the upload batch
 * folder means numbered files never overwrite an earlier upload.
 *
 * When no naming context is supplied, the builder falls back to the original
 * opaque tenant path (salons/{salonId}/...) so existing callers and old keys
 * keep working.
 */

const DEFAULT_CATEGORY = "misc";

const CATEGORY_SCOPES = {
  gallery: "salon",
  branding: "salon",
  logo: "salon",
  cover: "salon",
  services: "branch",
  staff: "branch",
  banners: "salon",
  documents: "tenant",
  avatars: "user",
  misc: "tenant",
  "platform-banners": "platform",
};

// A category can map to a different folder name when the public taxonomy and
// the storage path should differ. Branding variants share one folder, and
// platform-owned banners live outside every salon.
const CATEGORY_SEGMENTS = {
  logo: "branding",
  cover: "branding",
  "platform-banners": "banners",
};

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const normalizeCategory = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "")
    .substring(0, 40);

  return CATEGORY_SCOPES[normalized] ? normalized : DEFAULT_CATEGORY;
};

const slugify = (value, fallback = "file", maxLength = 60) => {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "") // drop extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, maxLength);

  return slug || fallback;
};

const resolveExtension = (originalName, mimeType) => {
  const extension = path.extname(originalName || "").toLowerCase().replace(".", "");
  if (extension) return extension;

  return MIME_EXTENSIONS[mimeType] || "bin";
};

const idSegment = (value) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .substring(0, 64);

/**
 * Stable, collision-resistant short id for a Mongo ObjectId. ObjectId prefixes
 * are timestamps, so truncating the id is not enough; hash the whole value.
 */
const shortHash = (value, length = 8) =>
  crypto
    .createHash("sha1")
    .update(String(value || ""))
    .digest("hex")
    .slice(0, length);

/**
 * One batch id per upload request. Files in the same request share the folder
 * and are named 1, 2, 3...; a later request gets a new folder and cannot
 * overwrite these objects.
 */
const createBatchId = (now = new Date()) => {
  const date = now.toISOString().slice(0, 10);
  return `${date}_${crypto.randomBytes(4).toString("hex")}`;
};

/**
 * Public URLs must not expose a customer-facing street address. Keep the
 * location readable with city + state only.
 */
const formatBranchAddress = (address) => {
  if (!address) return "";
  if (typeof address === "string") return address;

  return [address.city, address.state].filter(Boolean).join(" ");
};

const buildSalonSegment = ({
  salonId,
  salonName,
  ownerName,
  contextBranchName,
  contextBranchAddress,
}) => {
  const id = idSegment(salonId);
  if (!id) return null;

  const parts = [
    salonName ? slugify(salonName, "salon", 40) : null,
    ownerName ? slugify(ownerName, "owner", 30) : null,
    contextBranchName ? slugify(contextBranchName, "branch", 30) : null,
    contextBranchAddress ? slugify(contextBranchAddress, "location", 30) : null,
  ].filter(Boolean);

  // Owner and salon are often the same person; don't repeat the same segment.
  const uniqueParts = [...new Set(parts)];

  if (!uniqueParts.length) return `salons/${id}`;

  return `salons/${uniqueParts.join("_")}_${shortHash(id)}`;
};

const buildBranchSegment = ({ branchId, branchName, branchAddress }) => {
  const id = idSegment(branchId);
  if (!id) return null;

  const parts = [
    branchName ? slugify(branchName, "branch", 30) : null,
    branchAddress ? slugify(branchAddress, "location", 30) : null,
  ].filter(Boolean);

  return parts.length ? `${parts.join("_")}_${shortHash(id)}` : id;
};

const resolvePrefix = ({
  scope,
  salonId,
  branchId,
  userId,
  salonName,
  ownerName,
  contextBranchName,
  contextBranchAddress,
  branchName,
  branchAddress,
}) => {
  const user = idSegment(userId);
  const salonRoot = buildSalonSegment({
    salonId,
    salonName,
    ownerName,
    contextBranchName,
    contextBranchAddress,
  });
  const branchSegment = buildBranchSegment({
    branchId,
    branchName,
    branchAddress,
  });

  if (scope === "platform") return "platform";

  if (scope === "user") {
    if (user) return `users/${user}`;
    if (salonRoot) return salonRoot;
    return "platform";
  }

  if (scope === "branch") {
    if (salonRoot && branchSegment) {
      return `${salonRoot}/branches/${branchSegment}`;
    }
    if (salonRoot) return salonRoot;
    if (user) return `users/${user}`;
    return "platform";
  }

  if (scope === "salon") {
    if (salonRoot) return salonRoot;
    if (user) return `users/${user}`;
    return "platform";
  }

  // tenant-scoped: prefer salon, then user, then platform
  if (salonRoot) return salonRoot;
  if (user) return `users/${user}`;
  return "platform";
};

const buildObjectKey = ({
  category,
  originalName,
  mimeType,
  extension,
  customName,
  salonId,
  branchId,
  userId,
  hash,
  salonName,
  ownerName,
  contextBranchName,
  contextBranchAddress,
  branchName,
  branchAddress,
  batchId,
  sequence,
}) => {
  const safeCategory = normalizeCategory(category);
  const scope = CATEGORY_SCOPES[safeCategory];
  const prefix = resolvePrefix({
    scope,
    salonId,
    branchId,
    userId,
    salonName,
    ownerName,
    contextBranchName,
    contextBranchAddress,
    branchName,
    branchAddress,
  });

  const safeExtension = String(extension || resolveExtension(originalName, mimeType))
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .substring(0, 10) || "bin";

  const segment = CATEGORY_SEGMENTS[safeCategory] || safeCategory;
  const sequenceNumber = Number(sequence);
  const isNumbered = Number.isInteger(sequenceNumber) && sequenceNumber > 0;

  if (isNumbered) {
    // Every real upload request carries a batch id, but generate one defensively
    // so a direct service call can never write a bare `1.webp` that collides.
    const safeBatchId = idSegment(batchId) || createBatchId();
    return `${prefix}/${segment}/${safeBatchId}/${sequenceNumber}.${safeExtension}`;
  }

  const base = slugify(customName || originalName);
  const uniqueSuffix = String(hash || crypto.randomBytes(4).toString("hex"))
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

  return `${prefix}/${segment}/${base}-${uniqueSuffix}.${safeExtension}`;
};

module.exports = {
  buildObjectKey,
  normalizeCategory,
  slugify,
  resolveExtension,
  shortHash,
  createBatchId,
  formatBranchAddress,
  buildSalonSegment,
  buildBranchSegment,
  CATEGORY_SCOPES,
  CATEGORY_SEGMENTS,
  DEFAULT_CATEGORY,
};
