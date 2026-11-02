const mongoose = require("mongoose");
const publicIdPlugin = require("../plugins/publicIdPlugin");
const { PUBLIC_ID_PREFIXES } = require("../utils/publicId");

const uploadedFileSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    folder: {
      type: String,
      default: "uploads",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
    },
    isMock: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

uploadedFileSchema.index({ uploadedBy: 1, createdAt: -1 });

uploadedFileSchema.plugin(publicIdPlugin, { prefix: PUBLIC_ID_PREFIXES.uploadedFile });

module.exports = mongoose.model("UploadedFile", uploadedFileSchema);