const StorageService = require("../services/storage.service");
const { validatePresignedUpload } = require("../utils/uploadValidation");
const logger = require("../utils/logger");

const sanitizeFolder = (folder) => {
  if (!folder || typeof folder !== "string") return "general";
  const sanitized = folder.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 50);
  return sanitized || "general";
};

/**
 * Handle single file upload
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file payload provided in request under form field 'file'",
      });
    }

    const folder = sanitizeFolder(req.query.folder || req.body.folder);
    const { userId, role, salonId, branchId } = req.user || {};

    let customName = req.body.customName || req.query.customName;
    const title = req.body.title || req.query.title;
    const promoCode = req.body.promoCode || req.query.promoCode;
    if (!customName && (title || promoCode)) {
      customName = [title, promoCode].filter(Boolean).join("-");
    }

    const result = await StorageService.uploadBuffer({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder,
      customName,
      uploadedBy: userId,
      salonId,
      branchId,
    });

    return res.status(201).json({
      success: true,
      message: result.isMock
        ? "File processed (Cloudflare R2 is running in development fallback mode)"
        : "File uploaded successfully to Cloudflare R2",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle multiple files upload (batch up to 5 files)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files payload provided in request under form field 'files'",
      });
    }

    const folder = sanitizeFolder(req.query.folder || req.body.folder);
    const { userId, role, salonId, branchId } = req.user || {};

    let customName = req.body.customName || req.query.customName;
    const title = req.body.title || req.query.title;
    const promoCode = req.body.promoCode || req.query.promoCode;
    if (!customName && (title || promoCode)) {
      customName = [title, promoCode].filter(Boolean).join("-");
    }

    const uploadPromises = req.files.map((file, idx) =>
      StorageService.uploadBuffer({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder,
        customName: customName ? `${customName}-${idx + 1}` : undefined,
        uploadedBy: userId,
        salonId,
        branchId,
      })
    );

    const results = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Presigned Upload URL for direct client-to-R2 upload
 */
const getPresignedUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder } = req.body;
    const fileSize = req.body.fileSize ?? req.body.size;

    const validation = validatePresignedUpload({ fileName, fileType, fileSize });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { userId, salonId, branchId } = req.user;

    const result = await StorageService.generatePresignedUploadUrl({
      fileName,
      fileType: validation.fileType,
      fileSize: validation.fileSize,
      folder: sanitizeFolder(folder),
      uploadedBy: userId,
      salonId,
      branchId,
    });

    return res.status(200).json({
      success: true,
      message: result.isMock
        ? "Presigned URL generated (Development fallback mode active)"
        : "Presigned upload URL generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete uploaded asset from Cloudflare R2
 */
const deleteFile = async (req, res, next) => {
  try {
    const fileUrl = req.body.fileUrl || req.body.key || req.query.fileUrl || req.query.key;
    const { userId, role, salonId, branchId } = req.user;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide 'fileUrl' or 'key' to delete",
      });
    }

    const result = await StorageService.deleteFile(fileUrl, {
      userId,
      role,
      salonId,
      branchId,
    });

    if (!result.success && result.code === "UNAUTHORIZED") {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getPresignedUrl,
  deleteFile,
};
