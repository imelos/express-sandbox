const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip
    });
  });

  next();
}

module.exports = requestLogger;
