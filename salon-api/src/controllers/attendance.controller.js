const Attendance = require("../models/attendance.model");
const Branch = require("../models/branch.model");
const AppError = require("../utils/AppError");

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// POST /api/v1/attendance/punch-in
const punchIn = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { salonId, branchId } = req.user;
    const { notes } = req.body;
    const date = todayStr();

    if (!branchId) {
      return next(new AppError("You are not assigned to any branch", 400));
    }

    const existing = await Attendance.findOne({ staffId: userId, date });
    if (existing && existing.status === "ACTIVE") {
      return next(new AppError("Already punched in today", 409));
    }
    if (existing && (existing.status === "COMPLETED" || existing.status === "AUTO_CLOSED")) {
      return next(new AppError("Already completed a session today", 409));
    }

    const now = new Date();
    let isLate = false;
    let lateByMinutes = 0;

    const branch = await Branch.findById(branchId);
    if (branch && branch.workingHours) {
      const dayOfWeek = now.getDay();
      const dayEntry = branch.workingHours.find((h) => h.day === dayOfWeek);
      if (dayEntry && dayEntry.isOpen && dayEntry.openTime) {
        const [openH, openM] = dayEntry.openTime.split(":").map(Number);
        const openDate = new Date(now);
        openDate.setHours(openH, openM, 0, 0);
        if (now > openDate) {
          lateByMinutes = Math.round((now - openDate) / 60000);
          if (lateByMinutes > 0) isLate = true;
        }
      }
    }

    const attendance = await Attendance.create({
      staffId: userId,
      branchId,
      salonId,
      date,
      punchInTime: now,
      status: "ACTIVE",
      isLate,
      lateByMinutes,
      notes,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Punched in successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/attendance/punch-out
const punchOut = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const date = todayStr();
    const { notes } = req.body;

    const attendance = await Attendance.findOne({ staffId: userId, date, status: "ACTIVE" });
    if (!attendance) {
      return next(new AppError("No active session found for today", 404));
    }

    const now = new Date();
    attendance.punchOutTime = now;
    attendance.status = "COMPLETED";
    attendance.totalMinutes = Math.round((now - attendance.punchInTime) / 60000);
    if (notes) attendance.notes = notes;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Punched out successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/me/today
const getTodayStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const date = todayStr();
    const attendance = await Attendance.findOne({ staffId: userId, date });

    res.status(200).json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/me
const getMyAttendance = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;
    const filter = { staffId: userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await Attendance.find(filter).sort({ date: -1 }).limit(100).lean();

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/branch/:branchId
const getBranchAttendance = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate, staffId } = req.query;
    const { role: userRole, salonId, branchId: userBranchId } = req.user;

    if (userRole === "manager" && branchId !== userBranchId?.toString()) {
      return next(new AppError("Access denied. Not your branch.", 403));
    }

    const branch = await Branch.findById(branchId);
    if (!branch) return next(new AppError("Branch not found", 404));

    if (userRole === "owner" && branch.salonId.toString() !== salonId?.toString()) {
      return next(new AppError("Branch does not belong to your salon", 403));
    }

    const filter = { branchId };
    if (staffId) filter.staffId = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await Attendance.find(filter)
      .populate("staffId", "name email phone")
      .sort({ date: -1, punchInTime: -1 })
      .limit(500)
      .lean();

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/branch/:branchId/summary
const getAttendanceSummary = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;
    const { role: userRole, salonId, branchId: userBranchId } = req.user;

    if (userRole === "manager" && branchId !== userBranchId?.toString()) {
      return next(new AppError("Access denied. Not your branch.", 403));
    }

    const branch = await Branch.findById(branchId);
    if (!branch) return next(new AppError("Branch not found", 404));

    if (userRole === "owner" && branch.salonId.toString() !== salonId?.toString()) {
      return next(new AppError("Branch does not belong to your salon", 403));
    }

    const match = { branchId: branch._id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = startDate;
      if (endDate) match.date.$lte = endDate;
    }

    const summary = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$staffId",
          totalDays: { $sum: 1 },
          totalMinutes: { $sum: "$totalMinutes" },
          lateDays: { $sum: { $cond: ["$isLate", 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      {
        $project: {
          staffId: "$_id",
          staffName: "$staff.name",
          staffEmail: "$staff.email",
          totalDays: 1,
          totalHours: { $round: [{ $divide: ["$totalMinutes", 60] }, 1] },
          avgHoursPerDay: {
            $round: [{ $divide: [{ $divide: ["$totalMinutes", 60] }, { $max: ["$totalDays", 1] }] }, 1],
          },
          lateDays: 1,
          latePercentage: {
            $round: [{ $multiply: [{ $divide: ["$lateDays", { $max: ["$totalDays", 1] }] }, 100] }, 0],
          },
        },
      },
      { $sort: { staffName: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  getBranchAttendance,
  getAttendanceSummary,
};
