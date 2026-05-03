const rateLimit = require("express-rate-limit");
const config = require("../config");

const loginRateLimiter = rateLimit({
  windowMs: config.loginRateLimitWindowMs,
  max: config.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts"
  }
});

const adminRateLimiter = rateLimit({
  windowMs: config.adminRateLimitWindowMs,
  max: config.adminRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many admin requests"
  }
});

module.exports = {
  loginRateLimiter,
  adminRateLimiter
};
