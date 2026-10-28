// Keep tests hermetic: never connect to an external Redis instance, and
// never sign test tokens with a developer's local .env secret.
// This file runs before the app is imported, so dotenv (.env) cannot
// override these values or re-enable Redis for the test suite.
const crypto = require('crypto');

process.env.NODE_ENV = 'test';
process.env.REDIS_ENABLED = 'false';
process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');
process.env.EMAIL_VERIFICATION_SECRET = crypto.randomBytes(32).toString('hex');
process.env.APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'com.hairxsalon.test';

// Never let tests touch real object storage or paid external APIs.
process.env.R2_ACCOUNT_ID = '';
process.env.R2_ACCESS_KEY_ID = '';
process.env.R2_SECRET_ACCESS_KEY = '';
process.env.R2_BUCKET_NAME = '';
process.env.R2_PUBLIC_DOMAIN = '';
process.env.GOOGLE_MAPS_API_KEY = '';
process.env.BREVO_API_KEY = '';
