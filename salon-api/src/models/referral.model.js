const mongoose = require("mongoose");
const publicIdPlugin = require("../plugins/publicIdPlugin");
const { PUBLIC_ID_PREFIXES } = require("../utils/publicId");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "EXPIRED"],
      default: "PENDING",
    },
    rewardGranted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1 });
referralSchema.index({ referee: 1 }, { unique: true });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });

referralSchema.plugin(publicIdPlugin, { prefix: PUBLIC_ID_PREFIXES.referral });

module.exports = mongoose.model("Referral", referralSchema);
