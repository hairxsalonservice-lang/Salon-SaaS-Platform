// Shared CORS origin policy for the HTTP API and Socket.IO.
//
// Production/staging only trusts:
//   - origins explicitly listed in ALLOWED_ORIGINS
//   - subdomains of hairxsalon.com (the platform's own domain)
//
// Wildcard developer origins (localhost, private LAN IPs) are only accepted
// outside production/staging. Arbitrary hosting-provider subdomains (for
// example *.up.railway.app) are deliberately NOT trusted — deployments must
// list their exact frontend origins in ALLOWED_ORIGINS.

const parseAllowedOrigins = (raw = process.env.ALLOWED_ORIGINS) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const LOCAL_ORIGIN_PATTERN =
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const OWNED_DOMAIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*hairxsalon\.com$/i;

const isProductionLike = (nodeEnv) =>
  nodeEnv === 'production' || nodeEnv === 'staging';

const isAllowedOrigin = (
  origin,
  {
    nodeEnv = process.env.NODE_ENV,
    allowedOrigins = parseAllowedOrigins(),
  } = {},
) => {
  // Native mobile clients and server-to-server calls do not send Origin.
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  if (!isProductionLike(nodeEnv)) {
    if (allowedOrigins.includes('*')) return true;
    if (LOCAL_ORIGIN_PATTERN.test(origin)) return true;
  }

  return OWNED_DOMAIN_PATTERN.test(origin);
};

module.exports = {
  parseAllowedOrigins,
  isAllowedOrigin,
  LOCAL_ORIGIN_PATTERN,
  OWNED_DOMAIN_PATTERN,
};
