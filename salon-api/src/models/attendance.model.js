const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const attendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Staff is required"],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: [true, "Salon is required"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    punchInTime: {
      type: Date,
      required: [true, "Punch in time is required"],
    },
    punchOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "AUTO_CLOSED"],
      default: "ACTIVE",
    },
    totalMinutes: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateByMinutes: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ branchId: 1, date: 1, status: 1 });
attendanceSchema.index({ salonId: 1, date: 1 });

attendanceSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Attendance", attendanceSchema);
