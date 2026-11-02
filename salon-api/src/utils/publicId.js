const Counter = require("../models/counter.model");

/**
 * Sequential, human-readable public IDs.
 *
 * The database still uses Mongo ObjectIds for `_id` and every reference, so
 * introducing public IDs does not require a relational migration. Each model
 * gets a `publicId` such as SAL-000001, BRN-000006 or USR-000042.
 */

const PUBLIC_ID_WIDTH = 6;
const MAX_ALLOCATE_ATTEMPTS = 5;

const PUBLIC_ID_PREFIXES = {
  salon: "SAL",
  branch: "BRN",
  user: "USR",
  service: "SVC",
  slot: "SLT",
  appointment: "APT",
  attendance: "ATT",
  staffLeave: "LV",
  notification: "NTF",
  uploadedFile: "UPL",
  referral: "REF",
  banner: "BAN",
  ownerRegistrationRequest: "ORR",
  permission: "PRM",
  role: "ROL",
};

const formatPublicId = (prefix, sequence, width = PUBLIC_ID_WIDTH) =>
  `${prefix}-${String(sequence).padStart(width, "0")}`;

const parsePublicId = (value) => {
  const match = String(value || "").match(/^([A-Z]+)-(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], sequence: Number(match[2]) };
};

/**
 * Reserve `count` consecutive numbers in one atomic update and return the
 * formatted IDs. Reserving a range keeps bulk inserts fast: a 30-slot insert
 * uses one counter update instead of thirty.
 */
const allocatePublicIds = async (prefix, count = 1) => {
  if (!prefix || typeof prefix !== "string") {
    throw new Error("A public-id prefix is required");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Public-id count must be a positive integer");
  }

  for (let attempt = 1; attempt <= MAX_ALLOCATE_ATTEMPTS; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: prefix },
        { $inc: { seq: count } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      const end = counter.seq;
      const start = end - count + 1;

      return Array.from({ length: count }, (_, index) =>
        formatPublicId(prefix, start + index),
      );
    } catch (error) {
      // Two first-time upserts can race on the unique `_id`; retry the loser.
      if (error?.code === 11000 && attempt < MAX_ALLOCATE_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Could not allocate a public id for prefix ${prefix}`);
};

const nextPublicId = async (prefix) => {
  const [publicId] = await allocatePublicIds(prefix, 1);
  return publicId;
};

const nextPublicIds = (prefix, count) => allocatePublicIds(prefix, count);

/**
 * Make sure a counter is at least as high as the highest ID already stored.
 * Used after restoring a database or running the backfill script.
 */
const syncCounterToExistingIds = async (prefix, values = []) => {
  const maxSequence = values.reduce((max, value) => {
    const parsed = parsePublicId(value);
    if (!parsed || parsed.prefix !== prefix) return max;
    return Math.max(max, parsed.sequence);
  }, 0);

  if (maxSequence === 0) return 0;

  await Counter.updateOne(
    { _id: prefix },
    { $max: { seq: maxSequence } },
    { upsert: true },
  );

  return maxSequence;
};

module.exports = {
  PUBLIC_ID_PREFIXES,
  PUBLIC_ID_WIDTH,
  formatPublicId,
  parsePublicId,
  allocatePublicIds,
  nextPublicId,
  nextPublicIds,
  syncCounterToExistingIds,
};
