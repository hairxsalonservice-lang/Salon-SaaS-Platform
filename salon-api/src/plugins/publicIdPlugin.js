const { nextPublicId, nextPublicIds } = require("../utils/publicId");

/**
 * Adds a sequential, human-readable `publicId` to a schema and keeps it
 * populated for normal saves and for `insertMany` seeders.
 *
 * `_id` and all foreign keys stay as Mongo ObjectIds; `publicId` is an
 * additional indexed identifier for URLs, dashboards and support tickets.
 */
module.exports = function publicIdPlugin(schema, options = {}) {
  const prefix = options.prefix;
  if (!prefix) {
    throw new Error("publicIdPlugin requires a prefix");
  }

  schema.add({
    publicId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      immutable: true,
      trim: true,
      uppercase: true,
    },
  });

  schema.pre("validate", async function () {
    if (this.isNew && !this.publicId) {
      this.publicId = await nextPublicId(prefix);
    }
  });

  // Kareem v2 (Mongoose 9) invokes pre hooks as plain async functions and
  // passes the insertMany argument list directly; there is no `next` callback.
  schema.pre("insertMany", async function (docs) {
    const list = Array.isArray(docs) ? docs : [docs];
    const missing = list.filter((doc) => doc && !doc.publicId);
    if (missing.length === 0) return;

    const ids = await nextPublicIds(prefix, missing.length);
    missing.forEach((doc, index) => {
      doc.publicId = ids[index];
    });
  });
};
