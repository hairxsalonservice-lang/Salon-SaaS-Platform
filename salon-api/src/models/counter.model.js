const mongoose = require("mongoose");

/**
 * One counter document per entity prefix (SAL, BRN, USR, ...).
 * `$inc` is atomic, so multiple API instances can allocate IDs concurrently
 * without ever handing out the same number.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

module.exports = mongoose.model("Counter", counterSchema);
