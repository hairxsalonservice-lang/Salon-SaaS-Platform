const ALLOWED_PRESIGNED_MIME_TYPES = Object.freeze({
  "image/jpeg": ["jpg", "jpeg"],
  "image/jpg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
});

const MAX_PRESIGNED_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const extensionOf = (fileName) => {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : null;
};

const validatePresignedUpload = ({ fileName, fileType, fileSize }) => {
  if (!fileName || typeof fileName !== "string" || !fileName.trim()) {
    return { valid: false, message: "fileName is required" };
  }

  if (!fileType || typeof fileType !== "string") {
    return { valid: false, message: "fileType is required" };
  }

  const normalizedType = fileType.trim().toLowerCase();
  const allowedExtensions = ALLOWED_PRESIGNED_MIME_TYPES[normalizedType];

  if (!allowedExtensions) {
    return {
      valid: false,
      message:
        "Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF.",
    };
  }

  const extension = extensionOf(fileName);
  if (extension && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message: "File extension does not match the declared file type.",
    };
  }

  const parsedSize = Number(fileSize);
  if (!Number.isInteger(parsedSize) || parsedSize <= 0) {
    return { valid: false, message: "fileSize must be a positive integer in bytes" };
  }

  if (parsedSize > MAX_PRESIGNED_UPLOAD_BYTES) {
    return {
      valid: false,
      message: `File is too large. Maximum size is ${MAX_PRESIGNED_UPLOAD_BYTES / (1024 * 1024)} MB.`,
    };
  }

  return {
    valid: true,
    fileType: normalizedType,
    fileSize: parsedSize,
  };
};

module.exports = {
  ALLOWED_PRESIGNED_MIME_TYPES,
  MAX_PRESIGNED_UPLOAD_BYTES,
  validatePresignedUpload,
};
