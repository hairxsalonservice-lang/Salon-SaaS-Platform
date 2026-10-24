const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const checkPermission = require("../middleware/checkPermission");
const validate = require("../middleware/validate");
const {
  punchInValidator,
  punchOutValidator,
  attendanceQueryValidator,
} = require("../validators/attendance.validator");
const {
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  getBranchAttendance,
  getAttendanceSummary,
} = require("../controllers/attendance.controller");

router.use(authenticate);

// Self-service (staff & manager)
router.post("/punch-in", checkPermission("appointment:read"), punchInValidator, validate, punchIn);
router.post("/punch-out", checkPermission("appointment:read"), punchOutValidator, validate, punchOut);
router.get("/me/today", checkPermission("appointment:read"), getTodayStatus);
router.get("/me", checkPermission("appointment:read"), attendanceQueryValidator, validate, getMyAttendance);

// Branch reports (owner & manager)
router.get("/branch/:branchId", checkPermission("staff:read"), attendanceQueryValidator, validate, getBranchAttendance);
router.get("/branch/:branchId/summary", checkPermission("staff:read"), attendanceQueryValidator, validate, getAttendanceSummary);

module.exports = router;
