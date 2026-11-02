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

  if (!process.env.EMAIL_VERIFICATION_SECRET) {
    process.env.EMAIL_VERIFICATION_SECRET = process.env.JWT_ACCESS_SECRET;
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  EMAIL_VERIFICATION_SECRET not set — falling back to JWT_ACCESS_SECRET. Set a separate secret for defense in depth.');
    }
  }
};

module.exports = validateEnvSecrets;
