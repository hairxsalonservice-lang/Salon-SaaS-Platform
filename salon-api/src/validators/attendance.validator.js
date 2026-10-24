const { body, query, param } = require("express-validator");

const punchInValidator = [
  body("notes").optional().trim().isLength({ max: 200 }).withMessage("Notes must be under 200 characters"),
];

const punchOutValidator = [
  body("notes").optional().trim().isLength({ max: 200 }).withMessage("Notes must be under 200 characters"),
];

const attendanceQueryValidator = [
  query("startDate").optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("startDate must be YYYY-MM-DD"),
  query("endDate").optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("endDate must be YYYY-MM-DD"),
  query("staffId").optional().isMongoId().withMessage("Invalid staffId"),
];

module.exports = {
  punchInValidator,
  punchOutValidator,
  attendanceQueryValidator,
};
