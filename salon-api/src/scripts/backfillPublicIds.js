/**
 * Backfill publicId for all existing documents that don't have one.
 *
 * Usage:
 *   node salon-api/src/scripts/backfillPublicIds.js
 *
 * Requires MONGO_URI in .env (or passed as env var).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const { PUBLIC_ID_PREFIXES, allocatePublicIds } = require("../utils/publicId");

const MODELS = [
  { name: "Salon", path: "../models/salon.model", prefix: PUBLIC_ID_PREFIXES.salon },
  { name: "Branch", path: "../models/branch.model", prefix: PUBLIC_ID_PREFIXES.branch },
  { name: "User", path: "../models/user.model", prefix: PUBLIC_ID_PREFIXES.user },
  { name: "Service", path: "../models/service.model", prefix: PUBLIC_ID_PREFIXES.service },
  { name: "Slot", path: "../models/slot.model", prefix: PUBLIC_ID_PREFIXES.slot },
  { name: "Appointment", path: "../models/appointment.model", prefix: PUBLIC_ID_PREFIXES.appointment },
  { name: "Attendance", path: "../models/attendance.model", prefix: PUBLIC_ID_PREFIXES.attendance },
  { name: "StaffLeave", path: "../models/staffLeave.model", prefix: PUBLIC_ID_PREFIXES.staffLeave },
  { name: "Notification", path: "../models/notification.model", prefix: PUBLIC_ID_PREFIXES.notification },
  { name: "UploadedFile", path: "../models/uploadedFile.model", prefix: PUBLIC_ID_PREFIXES.uploadedFile },
  { name: "Banner", path: "../models/Banner", prefix: PUBLIC_ID_PREFIXES.banner },
  { name: "OwnerRegistrationRequest", path: "../models/ownerRegistrationRequest.model", prefix: PUBLIC_ID_PREFIXES.ownerRegistrationRequest },
  { name: "Permission", path: "../models/permission.model", prefix: PUBLIC_ID_PREFIXES.permission },
  { name: "Role", path: "../models/role.model", prefix: PUBLIC_ID_PREFIXES.role },
  { name: "Referral", path: "../models/referral.model", prefix: PUBLIC_ID_PREFIXES.referral },
];

const BATCH_SIZE = 200;

async function backfillModel(Model, prefix, modelName) {
  const docs = await Model.find(
    { $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: "" }] },
    { _id: 1 },
  )
    .sort({ _id: 1 })
    .lean();

  if (docs.length === 0) {
    console.log(`  ${modelName}: all documents already have publicId`);
    return 0;
  }

  let assigned = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const ids = await allocatePublicIds(prefix, batch.length);

    const bulkOps = batch.map((doc, idx) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { publicId: ids[idx] } },
      },
    }));

    await Model.bulkWrite(bulkOps, { ordered: false });
    assigned += batch.length;
  }

  console.log(`  ${modelName}: assigned ${assigned} publicIds`);
  return assigned;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI.trim());
  console.log("Connected.\n");

  let totalAssigned = 0;

  for (const { name, path, prefix } of MODELS) {
    try {
      const Model = require(path);
      totalAssigned += await backfillModel(Model, prefix, name);
    } catch (err) {
      console.error(`  ${name}: ERROR — ${err.message}`);
    }
  }

  console.log(`\nDone. Total publicIds assigned: ${totalAssigned}`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
