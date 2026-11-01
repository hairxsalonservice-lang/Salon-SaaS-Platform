const crypto = require("crypto");
const path = require("path");

/**
 * Central object-key builder.
 *
 * Layout:
 *   salons/{salonId}/gallery/...                 salon-level gallery
 *   salons/{salonId}/branding/...                logo / cover / profile images
 *   salons/{salonId}/branches/{branchId}/services/...
 *   salons/{salonId}/branches/{branchId}/staff/...
 *   salons/{salonId}/banners/...                 salon-owned marketing assets
 *   users/{userId}/avatars/...                   customer/user assets
 *   platform/banners/...                         admin/platform assets
 *
 * Every segment is sanitized and every filename gets a short random suffix so
 * two uploads with the same original name can never overwrite each other.
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

const slugify = (value, fallback = "file") => {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "") // drop extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);

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

const resolvePrefix = ({ scope, salonId, branchId, userId }) => {
  const salon = idSegment(salonId);
  const branch = idSegment(branchId);
  const user = idSegment(userId);

  if (scope === "platform") return "platform";

  if (scope === "user") {
    if (user) return `users/${user}`;
    if (salon) return `salons/${salon}`;
    return "platform";
  }

  if (scope === "branch") {
    if (salon && branch) return `salons/${salon}/branches/${branch}`;
    if (salon) return `salons/${salon}`;
    if (user) return `users/${user}`;
    return "platform";
  }

  if (scope === "salon") {
    if (salon) return `salons/${salon}`;
    if (user) return `users/${user}`;
    return "platform";
  }

  // tenant-scoped: prefer salon, then user, then platform
  if (salon) return `salons/${salon}`;
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
}) => {
  const safeCategory = normalizeCategory(category);
  const scope = CATEGORY_SCOPES[safeCategory];
  const prefix = resolvePrefix({ scope, salonId, branchId, userId });

  const safeExtension = String(extension || resolveExtension(originalName, mimeType))
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .substring(0, 10) || "bin";

  const base = slugify(customName || originalName);
  const uniqueSuffix = String(hash || crypto.randomBytes(4).toString("hex"))
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  const segment = CATEGORY_SEGMENTS[safeCategory] || safeCategory;

  return `${prefix}/${segment}/${base}-${uniqueSuffix}.${safeExtension}`;
};

module.exports = {
  buildObjectKey,
  normalizeCategory,
  slugify,
  resolveExtension,
  CATEGORY_SCOPES,
  CATEGORY_SEGMENTS,
  DEFAULT_CATEGORY,
};
