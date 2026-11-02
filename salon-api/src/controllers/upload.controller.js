const mongoose = require("mongoose");
const StorageService = require("../services/storage.service");
const { validatePresignedUpload } = require("../utils/uploadValidation");
const {
  normalizeCategory,
  createBatchId,
  formatBranchAddress,
} = require("../utils/storageKey");
const Branch = require("../models/branch.model");
const Salon = require("../models/salon.model");
const User = require("../models/user.model");

/**
 * Resolve the upload category from the modern `category` field, falling back to
 * the legacy `folder` field used by older panel builds. Unknown values map to
 * the safe default (`misc`) so a bad client can never control the key prefix.
 */
const resolveCategory = (source = {}) =>
  normalizeCategory(source.category || source.folder);

/**
 * Branch-scoped assets (services/staff) may be uploaded by an owner who has no
 * branch on their own session. Accept a requested branch only when it belongs
 * to the authenticated salon; managers/staff stay pinned to their own branch.
 */
const resolveBranchId = async ({ requestedBranchId, user }) => {
  if (user?.branchId) return user.branchId;
  if (!requestedBranchId || !user?.salonId) return undefined;
  if (!mongoose.isValidObjectId(requestedBranchId)) return undefined;

  const belongsToSalon = await Branch.exists({
    _id: requestedBranchId,
    salonId: user.salonId,
  });

  return belongsToSalon ? requestedBranchId : undefined;
};

/**
 * Resolve the readable folder parts for an upload.
 *
 * The salon's first branch is always used for the top-level folder so all of a
 * salon's assets stay under one prefix even when it has many branches.
 * Branch-scoped categories additionally get their own branch subfolder.
 */
const resolveNamingContext = async ({ salonId, branchId }) => {
  if (!salonId || !mongoose.isValidObjectId(salonId)) return {};

  const salon = await Salon.findById(salonId).select("name owner").lean();
  if (!salon) return {};

  const [owner, branches] = await Promise.all([
    salon.owner
      ? User.findById(salon.owner).select("name").lean()
      : Promise.resolve(null),
    Branch.find({ salonId })
      .select("name address createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean(),
  ]);

  const primaryBranch = branches[0] || null;
  const uploadBranch = branchId
    ? branches.find((branch) => String(branch._id) === String(branchId)) || null
    : null;

  return {
    salonName: salon.name,
    ownerName: owner?.name,
    contextBranchName: primaryBranch?.name,
    contextBranchAddress: formatBranchAddress(primaryBranch?.address),
    branchName: uploadBranch?.name,
    branchAddress: formatBranchAddress(uploadBranch?.address),
  };
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

    const category = resolveCategory({
      category: req.query.category || req.body.category,
      folder: req.query.folder || req.body.folder,
    });
    const { userId, salonId } = req.user || {};
    const branchId = await resolveBranchId({
      requestedBranchId: req.query.branchId || req.body.branchId,
      user: req.user,
    });

    let customName = req.body.customName || req.query.customName;
    const title = req.body.title || req.query.title;
    const promoCode = req.body.promoCode || req.query.promoCode;
    if (!customName && (title || promoCode)) {
      customName = [title, promoCode].filter(Boolean).join("-");
    }

    const naming = await resolveNamingContext({ salonId, branchId });

    const result = await StorageService.uploadBuffer({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      category,
      customName,
      uploadedBy: userId,
      salonId,
      branchId,
      ...naming,
      batchId: createBatchId(),
      sequence: 1,
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

    const category = resolveCategory({
      category: req.query.category || req.body.category,
      folder: req.query.folder || req.body.folder,
    });
    const { userId, salonId } = req.user || {};
    const branchId = await resolveBranchId({
      requestedBranchId: req.query.branchId || req.body.branchId,
      user: req.user,
    });

    let customName = req.body.customName || req.query.customName;
    const title = req.body.title || req.query.title;
    const promoCode = req.body.promoCode || req.query.promoCode;
    if (!customName && (title || promoCode)) {
      customName = [title, promoCode].filter(Boolean).join("-");
    }

    const naming = await resolveNamingContext({ salonId, branchId });
    const batchId = createBatchId();

    const uploadPromises = req.files.map((file, idx) =>
      StorageService.uploadBuffer({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        category,
        customName,
        uploadedBy: userId,
        salonId,
        branchId,
        ...naming,
        batchId,
        sequence: idx + 1,
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
    const { fileName, fileType, category, folder } = req.body;
    const fileSize = req.body.fileSize ?? req.body.size;

    const validation = validatePresignedUpload({ fileName, fileType, fileSize });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { userId, salonId } = req.user;
    const branchId = await resolveBranchId({
      requestedBranchId: req.body.branchId,
      user: req.user,
    });
    const naming = await resolveNamingContext({ salonId, branchId });

    const result = await StorageService.generatePresignedUploadUrl({
      fileName,
      fileType: validation.fileType,
      fileSize: validation.fileSize,
      category: resolveCategory({ category, folder }),
      uploadedBy: userId,
      salonId,
      branchId,
      ...naming,
      batchId: createBatchId(),
      sequence: 1,
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
