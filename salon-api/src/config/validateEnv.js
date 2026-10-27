const crypto = require("crypto");

const validateEnvSecrets = () => {
  // Test-only secrets are generated fresh for every test process. Never use
  // static fallback secrets here: a checked-in value could be reused to forge
  // tokens outside the test suite.
  if (process.env.NODE_ENV === "test") {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString("hex");
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString("hex");
  }

  const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredSecrets.filter(
    (key) => !process.env[key] || process.env[key].trim() === ''
  );

  if (missing.length > 0) {
    console.error(`🚨 FATAL SERVER STARTUP ERROR: Missing required environment secrets: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Fallback EMAIL_VERIFICATION_SECRET safely to JWT_ACCESS_SECRET if unset, eliminating hardcoded string literals
  if (!process.env.EMAIL_VERIFICATION_SECRET) {
    process.env.EMAIL_VERIFICATION_SECRET = process.env.JWT_ACCESS_SECRET;
  }
};

module.exports = validateEnvSecrets;
