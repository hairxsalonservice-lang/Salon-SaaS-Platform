const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, publicDomain, isConfigured } = require("../config/r2.config");
const logger = require("../utils/logger");
const { buildObjectKey, normalizeCategory } = require("../utils/storageKey");
const UploadedFile = require("../models/uploadedFile.model");
const Salon = require("../models/salon.model");
const sharp = require("sharp");

// Provider failures must never reach the client as an opaque 500. These messages
// are intentionally user-safe; the provider's response is only written to logs.
const STORAGE_CONFIG_ERROR_MESSAGE =
  "Image storage is temporarily unavailable due to a configuration error. Please contact support.";
const STORAGE_UNAVAILABLE_MESSAGE =
  "Image storage is temporarily unavailable. Please try again in a few minutes.";

const createStorageError = (cause) => {
  const httpStatus = cause?.$metadata?.httpStatusCode;
  const isAuthFailure = httpStatus === 401 || httpStatus === 403;
  const error = new Error(
    isAuthFailure ? STORAGE_CONFIG_ERROR_MESSAGE : STORAGE_UNAVAILABLE_MESSAGE
  );
  error.name = "StorageServiceError";
  error.statusCode = 503;
  error.code = isAuthFailure ? "STORAGE_UNAUTHORIZED" : "STORAGE_UNAVAILABLE";
  error.cause = cause;
  return error;
};

let healthCache = null;

class StorageService {
  /**
   * Helper to format public CDN URL for an R2 object key
   */
  static _getPublicUrl(key) {
    if (publicDomain) {
      return `${publicDomain}/${key}`;
    }
    return `https://${bucketName}.r2.dev/${key}`;
  }

  /**
   * Upload a raw file Buffer to Cloudflare R2
   */
  static async uploadBuffer({
    buffer,
    originalName,
    mimeType,
    category,
    folder,
    customName,
    uploadedBy,
    salonId,
    branchId,
    salonName,
    ownerName,
    contextBranchName,
    contextBranchAddress,
    branchName,
    branchAddress,
    batchId,
    sequence,
  }) {
    const safeCategory = normalizeCategory(category || folder);
    let finalBuffer = buffer;
    let finalExt;
    let finalMimeType = mimeType;

    // Optimize images with sharp (skip SVGs and PDFs)
    if (mimeType.startsWith("image/") && mimeType !== "image/svg+xml") {
      try {
        finalBuffer = await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        finalExt = "webp";
        finalMimeType = "image/webp";
      } catch (error) {
        logger.warn(`[StorageService] Image optimization failed for ${originalName}: ${error.message}`);
      }
    }

    const key = buildObjectKey({
      category: safeCategory,
      originalName,
      mimeType: finalMimeType,
      extension: finalExt,
      customName,
      salonId,
      branchId,
      userId: uploadedBy,
      salonName,
      ownerName,
      contextBranchName,
      contextBranchAddress,
      branchName,
      branchAddress,
      batchId,
      sequence,
    });

    if (!isConfigured || !s3Client) {
      logger.warn(
        `[StorageService] R2 not configured. Mocking upload for key '${key}'. Set R2 environment variables to upload to cloud.`
      );
      const mockResult = {
        url: `https://placeholder.yoursalon.com/${key}`,
        key,
        bucket: bucketName,
        size: finalBuffer ? finalBuffer.length : 0,
        mimeType: finalMimeType,
        isMock: true,
      };
      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: mockResult.url,
          originalName,
          mimeType: finalMimeType,
          size: finalBuffer ? finalBuffer.length : 0,
          folder: safeCategory,
          uploadedBy,
          salonId,
          branchId,
          isMock: true,
        });
      }
      return mockResult;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: finalBuffer,
        ContentType: finalMimeType,
      });

      await s3Client.send(command);
      const publicUrl = this._getPublicUrl(key);

      logger.info(`✅ Uploaded asset to Cloudflare R2: ${key}`);

      const result = {
        url: publicUrl,
        key,
        bucket: bucketName,
        size: finalBuffer.length,
        mimeType: finalMimeType,
        isMock: false,
      };

      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: publicUrl,
          originalName,
          mimeType: finalMimeType,
          size: finalBuffer.length,
          folder: safeCategory,
          uploadedBy,
          salonId,
          branchId,
          isMock: false,
        });
      }

      return result;
    } catch (error) {
      const httpStatus = error?.$metadata?.httpStatusCode;
      logger.error(
        `🚨 Cloudflare R2 Upload Error for key '${key}': ${error.name || "Error"}` +
        `${httpStatus ? ` (HTTP ${httpStatus})` : ""} — ${error.message}`
      );
      throw createStorageError(error);
    }
  }

  /**
   * Delete an object from Cloudflare R2 bucket
   * @param {string} fileUrlOrKey - The file URL or key to delete
   * @param {Object} options - Options for ownership verification
   * @param {string} options.userId - The user ID requesting the deletion
   * @param {string[]} options.allowedRoles - Roles that can delete any file (e.g., ['owner', 'admin', 'manager'])
   * @param {string} options.role - The role of the user requesting deletion
   * @returns {Promise<Object>} Result of deletion
   */
  static async deleteFile(fileUrlOrKey, options = {}) {
    if (!fileUrlOrKey) return { success: false, message: "No file URL or key provided" };

    const {
      userId,
      role,
      salonId,
      branchId,
      allowedRoles = ["owner", "manager", "superadmin"],
    } = options;

    // Extract key if a full URL was provided
    let key = fileUrlOrKey;
    if (fileUrlOrKey.startsWith("http://") || fileUrlOrKey.startsWith("https://")) {
      try {
        const parsed = new URL(fileUrlOrKey);
        key = parsed.pathname.replace(/^\/+/, ""); // strip leading slash
      } catch (e) {
        key = fileUrlOrKey;
      }
    }

    // Verify ownership AND tenant scope before deletion. Elevated roles are
    // not a blank cheque: an owner/manager from salon A must never be able to
    // delete salon B's media.
    if (userId) {
      const fileRecord = await UploadedFile.findOne({ key });
      const isSuperadmin = role === "superadmin";

      if (!isSuperadmin) {
        if (!fileRecord) {
          // Untracked/legacy files cannot be attributed to a tenant, so only a
          // platform superadmin may remove them.
          logger.warn(`🚫 Unauthorized deletion attempt: user ${userId} (role: ${role}) tried to delete untracked file ${key}`);
          return { success: false, message: "Unauthorized: File ownership cannot be verified", code: "UNAUTHORIZED" };
        }

        const isUploader = fileRecord.uploadedBy.toString() === userId.toString();

        if (!isUploader) {
          if (!allowedRoles.includes(role)) {
            logger.warn(`🚫 Unauthorized deletion attempt: user ${userId} (role: ${role}) tried to delete file ${key} owned by ${fileRecord.uploadedBy}`);
            return { success: false, message: "Unauthorized: You can only delete files you uploaded", code: "UNAUTHORIZED" };
          }

          let tenantAllowed = false;

          if (role === "owner") {
            tenantAllowed = Boolean(
              salonId &&
              fileRecord.salonId &&
              fileRecord.salonId.toString() === salonId.toString(),
            );

            // Supports owners who manage more than one salon.
            if (!tenantAllowed && fileRecord.salonId) {
              tenantAllowed = Boolean(
                await Salon.exists({ _id: fileRecord.salonId, owner: userId }),
              );
            }
          } else if (role === "manager") {
            tenantAllowed = Boolean(
              salonId &&
              branchId &&
              fileRecord.salonId &&
              fileRecord.branchId &&
              fileRecord.salonId.toString() === salonId.toString() &&
              fileRecord.branchId.toString() === branchId.toString(),
            );
          }

          if (!tenantAllowed) {
            logger.warn(`🚫 Cross-tenant deletion blocked: user ${userId} (role: ${role}, salon ${salonId || "none"}, branch ${branchId || "none"}) tried to delete file ${key}`);
            return { success: false, message: "Unauthorized: This file belongs to another salon or branch", code: "UNAUTHORIZED" };
          }
        }
      }
    }

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking deletion for key '${key}'.`);
      // Still remove from DB if tracked
      await UploadedFile.deleteOne({ key });
      return { success: true, key, isMock: true };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`🗑️ Deleted asset from Cloudflare R2: ${key}`);

      // Remove from tracking DB
      await UploadedFile.deleteOne({ key });

      return { success: true, key, isMock: false };
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Deletion Error for key '${key}': ${error.message}`);
      throw new Error(`Cloud storage deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate a Presigned Upload URL for direct client-to-R2 uploads
   */
  static async generatePresignedUploadUrl({
    fileName,
    fileType,
    fileSize,
    category,
    folder,
    expiresIn = 900,
    uploadedBy,
    salonId,
    branchId,
    salonName,
    ownerName,
    contextBranchName,
    contextBranchAddress,
    branchName,
    branchAddress,
    batchId,
    sequence,
  }) {
    const { validatePresignedUpload } = require("../utils/uploadValidation");
    const validation = validatePresignedUpload({ fileName, fileType, fileSize });

    if (!validation.valid) {
      const error = new Error(validation.message);
      error.statusCode = 400;
      throw error;
    }

    const normalizedType = validation.fileType;
    const normalizedSize = validation.fileSize;
    const safeCategory = normalizeCategory(category || folder);

    // Defense in depth: the key is built here from the authenticated tenant, so
    // callers cannot inject path segments even if validation is bypassed.
    const key = buildObjectKey({
      category: safeCategory,
      originalName: fileName,
      mimeType: normalizedType,
      salonId,
      branchId,
      userId: uploadedBy,
      salonName,
      ownerName,
      contextBranchName,
      contextBranchAddress,
      branchName,
      branchAddress,
      batchId,
      sequence,
    });

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking presigned URL for key '${key}'.`);
      const mockResult = {
        uploadUrl: `https://placeholder.yoursalon.com/upload-mock?key=${key}`,
        publicUrl: `https://placeholder.yoursalon.com/${key}`,
        key,
        expiresIn,
        isMock: true,
      };
      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: mockResult.publicUrl,
          originalName: fileName,
          mimeType: normalizedType,
          size: normalizedSize,
          folder: safeCategory,
          uploadedBy,
          salonId,
          branchId,
          isMock: true,
        });
      }
      return mockResult;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: normalizedType,
        // Signed into the URL: the client must upload exactly this many bytes.
        ContentLength: normalizedSize,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const publicUrl = this._getPublicUrl(key);

      logger.info(`🔑 Generated R2 presigned upload URL for key: ${key}`);

      const result = {
        uploadUrl,
        publicUrl,
        key,
        expiresIn,
        isMock: false,
      };

      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: publicUrl,
          originalName: fileName,
          mimeType: normalizedType,
          size: normalizedSize,
          folder: safeCategory,
          uploadedBy,
          salonId,
          branchId,
          isMock: false,
        });
      }

      return result;
    } catch (error) {
      const httpStatus = error?.$metadata?.httpStatusCode;
      logger.error(
        `🚨 Cloudflare R2 Presigned URL Error: ${error.name || "Error"}` +
        `${httpStatus ? ` (HTTP ${httpStatus})` : ""} — ${error.message}`
      );
      throw createStorageError(error);
    }
  }

  /**
   * Verify that the object-storage credentials can actually reach the bucket.
   * Configuration being present is not proof that the key works, so the health
   * endpoint uses this instead of only checking environment variables.
   */
  static async checkConnectivity({ timeoutMs = 3000, cacheTtlMs = 60000 } = {}) {
    if (!isConfigured || !s3Client) {
      return { configured: false, reachable: false, status: "NOT_CONFIGURED" };
    }

    if (healthCache && Date.now() - healthCache.checkedAt < cacheTtlMs) {
      return healthCache.result;
    }

    let result;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }), {
        abortSignal: controller.signal,
      });
      result = { configured: true, reachable: true, status: "CONNECTED" };
    } catch (error) {
      const httpStatus = error?.$metadata?.httpStatusCode || null;
      let status = "UNREACHABLE";

      if (httpStatus === 401 || httpStatus === 403) {
        status = "UNAUTHORIZED";
      } else if (error?.name === "AbortError" || error?.name === "TimeoutError") {
        status = "TIMEOUT";
      }

      logger.warn(
        `[StorageService] R2 connectivity check failed (${status}` +
        `${httpStatus ? `, HTTP ${httpStatus}` : ""}): ${error.message}`
      );

      result = {
        configured: true,
        reachable: false,
        status,
        ...(httpStatus ? { httpStatus } : {}),
      };
    } finally {
      clearTimeout(timer);
    }

    healthCache = { checkedAt: Date.now(), result };
    return result;
  }
}

module.exports = StorageService;
