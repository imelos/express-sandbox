const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

function toNumber(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  databaseUrl: required("DATABASE_URL"),
  dbSsl: toBoolean(process.env.DB_SSL, false),
  dbSslRejectUnauthorized: toBoolean(
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
    true
  ),
  dbPoolMax: toNumber(process.env.DB_POOL_MAX, 10),
  dbIdleTimeoutMs: toNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  dbConnectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 10000),
  jwtSecret: required("JWT_SECRET"),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  loginRateLimitWindowMs: toNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  loginRateLimitMax: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  adminRateLimitWindowMs: toNumber(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 60 * 1000),
  adminRateLimitMax: toNumber(process.env.ADMIN_RATE_LIMIT_MAX, 120)
};
