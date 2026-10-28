// salon-api/src/utils/grantStaffBookingPermission.js
//
// One-off, non-destructive migration: allow managers and staff to create
// front-desk appointments for walk-in / phone customers.
//
// Run after deploying the staff-booking routes:
//   npm run migrate:staff-booking
//
// This only adds the `appointment:create` permission to the two roles. It
// never removes permissions, users, or appointments, so it is safe to re-run.

require("dotenv").config();
const mongoose = require("mongoose");

const Permission = require("../models/permission.model");
const Role = require("../models/role.model");
const { bustRoleCache } = require("./permissionCache");

const TARGET_ROLES = ["manager", "staff"];
const PERMISSION = { resource: "appointment", action: "create" };

async function grantStaffBookingPermission() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const permission = await Permission.findOneAndUpdate(
    PERMISSION,
    { $setOnInsert: { description: "Book an appointment" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`🔑 Permission ready: ${PERMISSION.resource}:${PERMISSION.action}`);

  for (const roleName of TARGET_ROLES) {
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      console.warn(`⚠️  Role "${roleName}" not found — skipped`);
      continue;
    }

    const alreadyGranted = role.permissions.some(
      (id) => id.toString() === permission._id.toString(),
    );

    if (alreadyGranted) {
      console.log(`↩️  ${roleName} already has ${PERMISSION.resource}:${PERMISSION.action}`);
    } else {
      await Role.updateOne(
        { _id: role._id },
        { $addToSet: { permissions: permission._id } },
      );
      console.log(`✅ Granted ${PERMISSION.resource}:${PERMISSION.action} to ${roleName}`);
    }

    // The permission list is cached per role; clear it so the next request
    // sees the new permission immediately instead of after the 24h TTL.
    await bustRoleCache(roleName);
  }

  console.log("🎉 Staff booking permission migration complete");
}

if (require.main === module) {
  grantStaffBookingPermission()
    .catch((error) => {
      console.error("❌ Migration failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = grantStaffBookingPermission;
